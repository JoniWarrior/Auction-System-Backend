import { Injectable, NotFoundException, Logger, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository, LessThan, FindOptionsWhere } from 'typeorm';
import { CreateAuctionDto } from './dto/create-auction.dto';
import { Auction, STATUS } from './entities/auction.entity';
import { Bidding } from './../biddings/entities/bidding.entity';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ItemsService } from 'src/items/items.service';
import { BiddingsService } from 'src/biddings/biddings.service';
import { FindAuctionsFilterDTO } from './dto/auctions-filter.dto';

@Injectable()
export class AuctionsService {
  private readonly logger = new Logger(AuctionsService.name);

  constructor(
    @InjectRepository(Auction)
    private auctionsRepository: Repository<Auction>,
    private itemsService: ItemsService,

    @Inject(forwardRef(() => BiddingsService))
    private biddingsService: BiddingsService
  ) { }

  private async getAuction(id: string, relations: string[] = []): Promise<Auction> {
    const auction = await this.auctionsRepository.findOne({ where: { id }, relations });
    if (!auction) throw new NotFoundException(`Auction with Id: ${id} not found`);
    return auction;
  }

  private async getHighestBid(auction: Auction): Promise<Bidding | null> {
    if (!auction.biddings || auction.biddings.length === 0) return null;
    return auction.biddings.reduce((max, bidding) =>
      bidding.amount > max.amount ? bidding : max,
      auction.biddings[0]
    );
  }

  async create(createAuctionDto: CreateAuctionDto): Promise<Auction> {
    const item = await this.itemsService.findOne(createAuctionDto.itemId);
    const { starting_price, end_time } = createAuctionDto;
    const auction = this.auctionsRepository.create({
      starting_price,
      end_time,
      current_price: starting_price,
      item
    });
    const savedAuction = await this.auctionsRepository.save(auction);
    savedAuction.item = item; // attach manually the item relation too
    return savedAuction;
  }

  async findAll(filters: FindAuctionsFilterDTO): Promise<Auction[]> {
    const where: FindOptionsWhere<Auction> = {};
    if (filters.status) where.status = filters.status;

    const limit = filters.limit ?? 8;
    const page = filters.page ?? 1;
    const skip = (page - 1) * limit;
    
    const auctions = await this.auctionsRepository.find({
      where,
      take : limit,
      skip,
      order : { end_time : "DESC"},
      relations: ['item', 'item.seller', 'biddings', "winningBid"],
    });

    if (!auctions.length) {
      if (filters.status) {
        throw new NotFoundException(`No auctions with status ${filters.status} found`)
      } else {
        throw new NotFoundException(`No auctions found`)
      }
    }
    return auctions;
  }

  async findMyAuctionsAsSeller(userId: string): Promise<Auction[]> {
    const auctions = await this.auctionsRepository.createQueryBuilder("auction")
    .leftJoinAndSelect("auction.item", "item")
    .leftJoinAndSelect("item.seller", "seller")
    .leftJoinAndSelect("auction.biddings", "biddings")
    .where("seller.id = :userId", {userId})
    .getMany();
    return auctions;
  }

  async findMyAuctionsAsBidder(bidderId: string): Promise<Auction[]> {
    const auctions = await this.auctionsRepository
      .createQueryBuilder("auction")
      .leftJoinAndSelect("auction.item", "item")
      .leftJoinAndSelect("item.seller", "seller")
      .leftJoinAndSelect("auction.biddings", "biddings")
      .leftJoinAndSelect("auction.winningBid", "winningBid")
      .where("biddings.bidder_id = :bidderId", { bidderId })
      .getMany();
    return auctions;
  }

  async findOne(id: string): Promise<Auction> {
    const auction = await this.getAuction(id, ["item", "item.seller", "biddings", "biddings.bidder", "winningBid"]);
    return auction;
  }

  async update(id: string, data : Partial<Auction>): Promise<Auction> {
    const originalAuction = await this.getAuction(id);
    const updatedAuction = this.auctionsRepository.merge(originalAuction, data);
    return this.auctionsRepository.save(updatedAuction);
  }

  async remove(id: string): Promise<Auction> {
    const auction = await this.getAuction(id);
    await this.auctionsRepository.remove(auction);
    return auction;
  }

  async findBiddingsOfAuction(auctionId: string): Promise<Bidding[]> {
    const biddings = await this.biddingsService.findByAuction(auctionId);
    if (!biddings) throw new NotFoundException(`No bidings found for the auction ${auctionId}`);
    return biddings;
  }


  @Cron(CronExpression.EVERY_MINUTE)
  async handleExpiredAuctions() {
    this.logger.log('Checking for Expired Auctions...');
    const now = new Date();

    const expiredAuctions = await this.auctionsRepository.find({
      where: {
        end_time: LessThan(now),
        status: Not(STATUS.FINISHED),
      },
      relations: ['biddings', 'biddings.bidder'],
    });
    this.logger.log(`Found : ${expiredAuctions.length} expired auctions to close! `);
    await Promise.all(expiredAuctions.map(auction => this.closeAuction(auction.id)));
  }

  async closeAuction(auctionId: string): Promise<Auction> {
    this.logger.log(`Closing auction : ${auctionId} ...`);
    const auction = await this.getAuction(auctionId, ["biddings", "biddings.bidder", "item"]);

    if (auction.status === STATUS.FINISHED) {
      this.logger.log(`Auction with Id: ${auction.id} has already finished`);
      return auction;
    }

    const highestBid = await this.getHighestBid(auction);
    const winningAmount = highestBid?.amount ?? auction.starting_price;

    if (highestBid) {
      this.logger.log(`Auction ${auctionId} closed. Winner: ${highestBid.bidder.id} with bid: ${winningAmount}`);
      auction.winningBid = highestBid;
    } else {
      this.logger.log(`Auction ${auctionId} closed with no bids`);
    }

    auction.status = STATUS.FINISHED;
    auction.current_price = winningAmount;
    return this.auctionsRepository.save(auction);
  }

  // async getAuctionWinner(auctionId: string): Promise<{
  //   winner: User | null;
  //   winning_bid_amount: number;
  //   auction: Auction;
  // }> {
  //   const auction = await this.getAuction(auctionId, ['biddings', 'biddings.bidder', 'item', 'winningBid', "winningBid.bidder"]);
  //   if (auction.status !== STATUS.FINISHED) throw new BadRequestException(`Auction with ID ${auctionId} not finished yet`);

  //   const winnerBid = auction.winningBid ?? (await this.getHighestBid(auction));
  //   const winningAmount = winnerBid?.amount ?? auction.starting_price;
  //   const winner = winnerBid?.bidder ?? null;
  //   return { winner, winning_bid_amount: winningAmount, auction };
  // }

  async validateAuctionForBidding(auctionId: string): Promise<Auction> {
    const auction = await this.getAuction(auctionId, ['biddings', 'item']);
    if (auction.status === STATUS.FINISHED) throw new BadRequestException('Auction has already finished');

    const now = new Date();
    if (now > auction.end_time) {
      await this.closeAuction(auctionId);
      throw new BadRequestException('Auction has ended');
    }
    return auction;
  }
}
