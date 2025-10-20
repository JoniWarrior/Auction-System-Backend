import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository, LessThan, FindOptionsWhere } from 'typeorm';
import { CreateAuction } from './types/create-auction.type';
import { Auction, STATUS } from '../../entities/auction.entity';
import { Bidding } from '../../entities/bidding.entity';
import { Cron, CronExpression } from '@nestjs/schedule';
import { FindAuctionsFilter } from './types/auctions-filter.type';
import { AuctionBiddingHelperService } from '../shared/auction-bidding-helper.service';

@Injectable()
export class AuctionsService {
  private readonly logger = new Logger(AuctionsService.name);

  constructor(
    @InjectRepository(Auction)
    private auctionsRepository: Repository<Auction>,
    private helperService: AuctionBiddingHelperService,
  ) {}

  private async getAuction(
    id: string,
    relations: string[] = [],
  ): Promise<Auction> {
    const auction = await this.auctionsRepository.findOne({
      where: { id },
      relations,
    });
    if (!auction)
      throw new NotFoundException(`Auction with Id: ${id} not found`);
    return auction;
  }

  private async getHighestBid(auction: Auction): Promise<Bidding | null> {
    if (!auction.biddings || auction.biddings.length === 0) return null;
    return auction.biddings.reduce(
      (max, bidding) => (bidding.amount > max.amount ? bidding : max),
      auction.biddings[0],
    );
  }

  async create(createAuction: CreateAuction): Promise<Auction> {
    const { starting_price, end_time, itemId } = createAuction;

    const auction = this.auctionsRepository.create({
      starting_price,
      end_time,
      current_price: starting_price,
      item: { id: itemId },
    });

    return this.auctionsRepository.save(auction);
  }

  async findAll(filters: FindAuctionsFilter): Promise<Auction[]> {
    const where: FindOptionsWhere<Auction> = {};
    if (filters.status) where.status = filters.status;

    const limit = filters.limit ?? 8;
    const page = filters.page ?? 1;
    const skip = (page - 1) * limit;

    const auctions = await this.auctionsRepository.find({
      where,
      take: limit,
      skip,
      order: { end_time: 'DESC' },
      relations: ['item', 'item.seller', 'biddings', 'winningBid'],
    });

    if (!auctions.length) {
      if (filters.status) {
        throw new NotFoundException(
          `No auctions with status ${filters.status} found`,
        );
      } else {
        throw new NotFoundException(`No auctions found`);
      }
    }
    return auctions;
  }

  async findMyAuctionsAsSeller(sellerId: string): Promise<Auction[]> {
    return this.auctionsRepository.find({
      where: {
        item: {
          seller: { id: sellerId },
        },
      },
      relations: ['item', 'item.seller', 'biddings'],
    });
  }

  async findMyAuctionsAsBidder(bidderId: string): Promise<Auction[]> {
    return this.auctionsRepository.find({
      where: {
        biddings: { bidder: { id: bidderId } },
      },
      relations: ['item', 'item.seller', 'biddings', 'winningBid'],
    });
  }
  
  async findOne(id: string): Promise<Auction> {
    const auction = await this.getAuction(id, [
      'item',
      'item.seller',
      'biddings',
      'biddings.bidder',
      'winningBid',
    ]);
    return auction;
  }

  async update(id: string, data: Partial<Auction>): Promise<Auction> {
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
    const biddings = await this.helperService.findBiddingsOfAuction(auctionId);
    if (!biddings)
      throw new NotFoundException(
        `No bidings found for the auction ${auctionId}`,
      );
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
    await Promise.all(
      expiredAuctions.map((auction) => this.closeAuction(auction.id)),
    );
  }

  async closeAuction(auctionId: string): Promise<Auction> {
    this.logger.log(`Closing auction : ${auctionId} ...`);
    const auction = await this.getAuction(auctionId, [
      'biddings',
      'biddings.bidder',
      'item',
    ]);

    if (auction.status === STATUS.FINISHED) {
      this.logger.log(`Auction with Id: ${auction.id} has already finished`);
      return auction;
    }

    const highestBid = await this.getHighestBid(auction);
    const winningAmount = highestBid?.amount ?? auction.starting_price;

    if (highestBid) {
      this.logger.log(
        `Auction ${auctionId} closed. Winner: ${highestBid.bidder.id} with bid: ${winningAmount}`,
      );
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
}
