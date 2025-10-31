import {
  Injectable,
  NotFoundException,
  Logger,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository, LessThan, FindOptionsWhere } from 'typeorm';
import { CreateAuction } from 'src/def/types/auction/create-auction';
import { Auction } from '../../entity/auction.entity';
import { Bidding } from '../../entity/bidding.entity';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AuctionBiddingHelperService } from '../shared/auction-bidding-helper.service';
import { AuctionStatus } from 'src/def/enums/auction_status';
import { PaginationQuery } from 'src/def/pagination-query';
import moment from 'moment';
import { User } from 'src/entity/user.entity';

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

  private async determineAuctionResult(auction: Auction): Promise<{
    winningBid: Bidding | null;
    winner: User | null;
    winningAmount: number;
  }> {
    const highestBid = await this.getHighestBid(auction);
    const winningAmount = highestBid?.amount ?? auction.startingPrice;
    const winner = highestBid?.bidder ?? null;

    return {
      winningBid: highestBid ?? null,
      winner,
      winningAmount,
    };
  }

  async create(createAuction: CreateAuction): Promise<Auction> {
    const { startingPrice, endTime, itemId } = createAuction;

    const auction = this.auctionsRepository.create({
      startingPrice,
      endTime,
      currentPrice: startingPrice,
      itemId,
    });

    return this.auctionsRepository.save(auction);
  }

  async findAll(
    { qs, pageSize, page }: PaginationQuery,
    status: any,
  ): Promise<Auction[]> {
    const take = Number(pageSize) || 10;
    const skip = ((Number(page) || 1) - 1) * take;

    const where: FindOptionsWhere<Auction> = {};
    where.status = status;

    return this.auctionsRepository.find({
      relations:
           ['item', 'item.seller', "winningBid", "winningBid.bidder"],
      take,
      skip,
      where,
      order: { startingPrice: 'ASC' },
    });
  }

  async findMyAuctionsAsSeller(sellerId: string): Promise<Auction[]> {
    return this.auctionsRepository.find({
      where: {
        item: {
          sellerId,
        },
      },
      relations: ['item', 'item.seller', 'biddings'],
    });
  }

  async findMyAuctionsAsBidder(bidderId: string): Promise<Auction[]> {
    return this.auctionsRepository.find({
      where: {
        biddings: { bidderId },
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

  async delete(id: string) {
    const existingAuction = await this.auctionsRepository.findOne({
      where: { id },
    });
    if (!existingAuction)
      throw new NotFoundException(`Auction with Id: ${id} not found`);
    await this.auctionsRepository.softDelete(id);
    return { message: `Auction ${id} has been soft-deleted` };
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

    const expiredAuctions = await this.auctionsRepository.find({
      where: {
        endTime: LessThan(moment().toDate()),
        status: Not(AuctionStatus.FINISHED),
      },
      relations: ['item', 'biddings', 'biddings.bidder'],
    });
    this.logger.log(
      `Found : ${expiredAuctions.length} expired auctions to close! `,
    );
    await Promise.all(
      expiredAuctions.map((auction) => this.closeAuction(auction.id)),
    );
  }

  async closeAuction(
    auctionId: string,
    currentUserId?: string,
  ): Promise<{
    winner: User | null;
    winning_bid_amount: number;
    auction: Auction;
  }> {
    this.logger.log(`Closing auction: ${auctionId} ...`);

    const auction = await this.getAuction(auctionId, [
      'biddings',
      'biddings.bidder',
      'item',
      'item.seller',
    ]);

    if (currentUserId && currentUserId !== auction.item.seller.id) {
      throw new UnauthorizedException(
        'Only the owner of the auction can close it!',
      );
    }

    if (auction.status === AuctionStatus.FINISHED) {
      throw new BadRequestException('Auction has already finished');
    }

    const { winningBid, winner, winningAmount } =
      await this.determineAuctionResult(auction);

    if (winningBid) {
      this.logger.log(
        `Auction ${auctionId} closed. Winner: ${winner?.name} with bid: ${winningAmount}`,
      );

      auction.winningBid = winningBid;
    } else {
      this.logger.log(`Auction ${auctionId} closed with no bids`);
    }

    auction.status = AuctionStatus.FINISHED;
    auction.currentPrice = winningAmount;

    const savedAuction = await this.auctionsRepository.save(auction);

    return {
      winner,
      winning_bid_amount: winningAmount,
      auction: savedAuction,
    };
  }

}
