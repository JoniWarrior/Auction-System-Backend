import {Injectable, NotFoundException, Logger, BadRequestException} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository, LessThan, MoreThan } from 'typeorm';
import { CreateAuctionDto } from './dto/create-auction.dto';
import { UpdateAuctionDto } from './dto/update-auction.dto';
import { Auction, STATUS } from './entities/auction.entity';
import { Item } from './../items/entities/item.entity';
import { User } from './../users/entities/user.entity';
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

  private async getAuctionOrFail(id: string, relations : string[] = ["biddings", "biddings.bidder", "item"]) : Promise<Auction> {
    const auction = await this.auctionsRepository.findOne({where : {id}, relations});
    if (!auction) throw new NotFoundException(`Auction with Id: ${id} not found`);
    return auction;
  }
  
  private async getHighestBid(auction : Auction) {
    return auction.biddings.reduce((max, bidding) => 
    (bidding.amount > max.amount ? bidding : max), auction.biddings[0])};

  async create(createAuctionDto: CreateAuctionDto): Promise<Auction> {
    const item = await this.itemsRepository.findOneBy({
      id: createAuctionDto.itemId,
    });
    if (!item) throw new NotFoundException(`Item with Id ${createAuctionDto.itemId} not found`,);
    
    const auction = this.auctionsRepository.create({
      starting_price: createAuctionDto.starting_price,
      end_time: createAuctionDto.end_time,
      current_price: createAuctionDto.starting_price,
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
    if (auctions.length === 0) throw new NotFoundException('No auctions found')
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

    if (auctions.length === 0) throw new NotFoundException("No bidding made at any auction")
    return auctions;
  }

  async findOne(id: string): Promise<Auction> {
    const auction = await this.getAuctionOrFail(id, ["item", "item.seller", "biddings", "biddings.bidder", "winningBid"]);
    return auction;
    // const auction = await this.auctionsRepository.findOne({
    //   where: { id },
    //   relations: [
    //     'item',
    //     'item.seller',
    //     'biddings',
    //     'biddings.bidder',
    //     'winningBid',
    //   ]
    // });
    // if (!auction) throw new NotFoundException(`There is no auction with Id ${id}`);
    // return auction;
  }

  async update(id: string, updateAuctionDTO: UpdateAuctionDto): Promise<Auction> {
    const originalAuction = await this.auctionsRepository.findOneBy({ id });
    if (!originalAuction)throw new NotFoundException(`No auction with Id ${id}`,);
  
    const updatedAuction = this.auctionsRepository.merge(originalAuction,updateAuctionDTO);
    return this.auctionsRepository.save(updatedAuction);
  }

  async remove(id: string): Promise<Auction> {
    const auction = await this.auctionsRepository.findOneBy({ id });
    if (!auction) throw new NotFoundException(`Auction with Id ${id} not found`);
    
    await this.auctionsRepository.remove(auction);
    return auction;
  }

  async findAuctionsByStatus(status: string): Promise<Auction[]> {
    if (!Object.values(STATUS).includes(status as STATUS)) throw new BadRequestException(`Invalid status ${status}`);
    
    const auctions = await this.auctionsRepository.find({
      where: { status: status as STATUS },
    });

    if (!auctions.length) throw new NotFoundException(`No auction with status ${status} currently`);
    return auctions;
  }

  async findBiddingsOfAuction(id: string): Promise<Bidding[]> {
    const auction = await this.auctionsRepository.findOneBy({ id });
    if (!auction) throw new NotFoundException(`No auction found with Id: ${id}`);
    
    const biddings = await this.biddingsRepository.find({
      where: { auction: { id: auction.id } },
      relations: ['bidder'],
      order: { amount: 'DESC' },
    });

    if (!biddings.length) throw new NotFoundException(`No bidings found for the auction ${id}`);
  
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

    const auction = await this.getAuctionOrFail(auctionId);
 
    if (auction.status === STATUS.FINISHED) {
      this.logger.log(`Auction with Id: ${auction.id} has already finished`);
      return auction;
    }

    let winningBid: Bidding | null = null;
    let winningBidAmount = auction.starting_price;

    if (auction.biddings && auction.biddings.length > 0) {
      winningBid = await this.getHighestBid(auction);
      winningBidAmount = winningBid.amount;
      this.logger.log(`Auction ${auctionId} closed. Winner: ${winningBid!.bidder.id} with bid: ${winningBidAmount}`);
    } else {
      this.logger.log(`Auction ${auctionId} closed with no bids`);
    }

    auction.status = STATUS.FINISHED;
    auction.current_price = winningBidAmount;

    if (winningBid) auction.winningBid = winningBid;
    return await this.auctionsRepository.save(auction);
  }

  async getAuctionWinner(auctionId: string): Promise<{
    winner: User | null;
    winning_bid_amount: number;
    auction: Auction;
  }> {
    const auction = await this.getAuctionOrFail(auctionId, ['biddings', 'biddings.bidder', 'item', 'winningBid', "winningBid.bidder"]);
    if (auction.status !== STATUS.FINISHED) throw new BadRequestException(`Auction with ID ${auctionId} not finished yet`);
    
    if (auction.winningBid) return {
        winner: auction.winningBid.bidder,
        winning_bid_amount: auction.winningBid.amount,
        auction,
      };
    
    if (!auction.biddings || auction.biddings.length === 0) return {
        winner: null,
        winning_bid_amount: auction.starting_price,
        auction,
      };
  
    const highestBid = await this.getHighestBid(auction);
    
    return {
      winner: highestBid.bidder,
      winning_bid_amount: highestBid.amount,
      auction,
    };
  }

  async validateAuctionForBidding(auctionId: string): Promise<Auction> {
    const auction = await this.getAuctionOrFail(auctionId,['biddings', 'item']);
    if (auction.status === STATUS.FINISHED) throw new BadRequestException('Auction has already finished');

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
    return auctions;
  }

  async getFinishedAuctions(): Promise<Auction[]> {
    return await this.auctionsRepository.find({
      where: { status: STATUS.FINISHED },
      relations: ['item', 'biddings', 'biddings.bidder', 'winningBid'],
    });
  }
}
