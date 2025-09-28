import {
  Injectable,
  NotFoundException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository, LessThan, MoreThan } from 'typeorm';
import { CreateAuctionDto } from './dto/create-auction.dto';
import { UpdateAuctionDto } from './dto/update-auction.dto';
import { Auction, STATUS } from './entities/auction.entity';
import { Item } from './../items/entities/item.entity';
import { Bidding } from './../biddings/entities/bidding.entity';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class AuctionsService {
  private readonly logger = new Logger(AuctionsService.name);

  constructor(
    @InjectRepository(Auction)
    private auctionsRepository: Repository<Auction>,

    @InjectRepository(Item)
    private itemsRepository: Repository<Item>,

    @InjectRepository(Bidding)
    private biddingsRepository: Repository<Bidding>,
  ) {}

  async create(createAuctionDto: CreateAuctionDto): Promise<Auction> {
    const item = await this.itemsRepository.findOneBy({
      id: createAuctionDto.itemId,
    });
    if (!item) {
      throw new NotFoundException(
        `Item with Id ${createAuctionDto.itemId} does not exist`,
      );
    }
    const auction = this.auctionsRepository.create({
      starting_price: createAuctionDto.starting_price,
      end_time: createAuctionDto.end_time,
      current_price: createAuctionDto.starting_price, // set initiallty to the starting price
      item,
    });

    const savedAuction = await this.auctionsRepository.save(auction);
    return this.auctionsRepository.findOneOrFail({
      where: { id: savedAuction.id },
      relations: ['item'],
    });
  }

  async findAll(): Promise<Auction[]> {
    const auctions = await this.auctionsRepository.find({
      relations: ['item', 'item.seller', 'biddings', "winningBid"],
    });
    if (auctions.length === 0) {
      throw new NotFoundException(
        'No auctions have been created in the DB yet',
      );
    }
    return auctions;
  }

  async findMyAuctionsAsSeller(userId: string): Promise<Auction[]> {
    const auctions = await this.auctionsRepository.find({
      relations: ['item', 'item.seller', 'biddings'],
      where: {
        item: {
          seller: {
            id: userId,
          },
        },
      },
    });
    return auctions;
  }

  async findMyAuctionsAsBidder(bidderId : string) : Promise<Auction[]> {
    const auctions = await this.auctionsRepository
    .createQueryBuilder("auction")
    .leftJoinAndSelect("auction.item", "item")
    .leftJoinAndSelect("item.seller", "seller")
    .leftJoinAndSelect("auction.biddings", "biddings")
    .leftJoinAndSelect("auction.winningBid", "winningBid")
    .where("biddings.bidder_id = :bidderId", {bidderId})
    .getMany();

    if (auctions.length === 0) {
      throw new NotFoundException("You have made no bidding in any of the featured auctions yet!")
    }
    return auctions;
  }

  async findOne(id: string): Promise<Auction> {
    const auction = await this.auctionsRepository.findOne({
      where: { id },
      relations: [
        'item',
        'item.seller',
        'biddings',
        'biddings.bidder',
        'winningBid',
      ]
    });
    if (!auction) {
      throw new NotFoundException(`There is no auction with Id ${id}`);
    }
    return auction;
  }

  async update(id: string, updateAuctionDTO: UpdateAuctionDto): Promise<Auction> {
    const originalAuction = await this.auctionsRepository.findOneBy({ id });
    if (!originalAuction) {
      throw new NotFoundException(
        `There is no auction created yet with Id ${id}`,
      );
    }

    const updatedAuction = this.auctionsRepository.merge(
      originalAuction,
      updateAuctionDTO,
    );
    return this.auctionsRepository.save(updatedAuction);
  }

  async remove(id: string): Promise<Auction> {
    const auction = await this.auctionsRepository.findOneBy({ id });
    if (!auction) {
      throw new NotFoundException(
        `There is not auction registered with Id ${id} yet`,
      );
    }
    await this.auctionsRepository.remove(auction);
    return auction;
  }

  async findAuctionsByStatus(status: string): Promise<Auction[]> {
    if (!Object.values(STATUS).includes(status as STATUS)) {
      throw new Error(`Invalid status ${status}`);
    }
    const auctions = await this.auctionsRepository.find({
      where: { status: status as STATUS },
    });

    if (auctions.length === 0) {
      throw new Error (`There is not any auction of the status ${status} currently`);
    }
    return auctions;
  }

  async findBiddingsOfAuction(id: string): Promise<Bidding[]> {
    const auction = await this.auctionsRepository.findOneBy({ id });
    if (!auction) {
      throw new NotFoundException(`No auction with Id: ${id} yet`);
    }

    const biddings = await this.biddingsRepository.find({
      where: { auction: { id: auction.id } },
      relations: ['bidder'],
      order: { amount: 'DESC' },
    });

    if (biddings.length === 0) {
      throw new NotFoundException(`No bids yet for the auction with Id ${id}`);
    }

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

    this.logger.log(
      `Found : ${expiredAuctions.length} expired auctions to close! `,
    );

    for (const auction of expiredAuctions) {
      await this.closeAuction(auction.id);
    }
  }

  async closeAuction(auctionId: string): Promise<Auction> {
    this.logger.log(`Closing auction : ${auctionId} ...`);

    const auction = await this.auctionsRepository.findOne({
      where: { id: auctionId },
      relations: ['biddings', 'biddings.bidder', 'item'],
    });

    if (!auction) {
      throw new NotFoundException(`Auction with Id: ${auction} not found`);
    }

    if (auction.status === STATUS.FINISHED) {
      this.logger.log(`Auction with Id: ${auction.id} has already finished`);
      return auction;
    }

    let winningBid: Bidding | null = null;
    let winningBidAmount = auction.starting_price;

    if (auction.biddings && auction.biddings.length > 0) {
      winningBid = auction.biddings.reduce(
        (max, bid) => (bid.amount > max.amount ? bid : max),
        auction.biddings[0],
      );

      winningBidAmount = winningBid?.amount;
      this.logger.log(
        `Auction ${auctionId} closed. Winner: ${winningBid.bidder.id} with bid: ${winningBidAmount}`,
      );
    } else {
      this.logger.log(`Auction ${auctionId} closed with no bids`);
    }

    auction.status = STATUS.FINISHED;
    auction.current_price = winningBidAmount;

    if (winningBid) {
      auction.winningBid = winningBid;
    }

    return await this.auctionsRepository.save(auction);
  }

  async getAuctionWinner(auctionId: string): Promise<{
    winner: any;
    winning_bid_amount: number;
    auction: Auction;
  }> {
    const auction = await this.auctionsRepository.findOne({
      where: { id: auctionId },
      relations: ['biddings', 'biddings.bidder', 'item', 'winningBid', "winningBid.bidder"],
    });

    if (!auction) {
      throw new NotFoundException(`Auction with ID ${auctionId} not found`);
    }

    if (auction.status !== STATUS.FINISHED) {
      throw new BadRequestException(
        `Auction with ID ${auctionId} is not finished yet`,
      );
    }

    if (auction.winningBid) {
      return {
        winner: auction.winningBid.bidder,
        winning_bid_amount: auction.winningBid.amount,
        auction,
      };
    }

    if (!auction.biddings || auction.biddings.length === 0) {
      return {
        winner: null,
        winning_bid_amount: auction.starting_price,
        auction,
      };
    }

    const highestBid = auction.biddings.reduce(
      (max, bid) => (bid.amount > max.amount ? bid : max),
      auction.biddings[0],
    );

    return {
      winner: highestBid.bidder,
      winning_bid_amount: highestBid.amount,
      auction,
    };
  }

  async validateAuctionForBidding(auctionId: string): Promise<Auction> {
    const auction = await this.auctionsRepository.findOne({
      where: { id: auctionId },
      relations: ['biddings', 'item'],
    });

    if (!auction) {
      throw new NotFoundException(`Auction with ID ${auctionId} not found`);
    }

    if (auction.status === STATUS.FINISHED) {
      throw new BadRequestException('Auction has already finished');
    }

    const now = new Date();
    if (now > auction.end_time) {
      await this.closeAuction(auctionId);
      throw new BadRequestException('Auction has ended');
    }

    return auction;
  }

  async getActiveAuctions(): Promise<Auction[]> {
    const now = new Date();
    const auctions = await this.auctionsRepository.find({
      where: {
        status: STATUS.ACTIVE,
        end_time: MoreThan(now),
      },
      relations: ['item', 'biddings'],
    });

    if (!auctions || auctions.length === 0) {
      console.log('No active auctions');
    }

    return auctions;
  }

  async getFinishedAuctions(): Promise<Auction[]> {
    return await this.auctionsRepository.find({
      where: { status: STATUS.FINISHED },
      relations: ['item', 'biddings', 'biddings.bidder', 'winningBid'],
    });
  }
}
