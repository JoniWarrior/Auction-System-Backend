import {
  Injectable,
  NotFoundException,
  Logger,
  BadRequestException,
  UnauthorizedException,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository, LessThan, FindOptionsWhere, ILike } from 'typeorm';
import { CreateAuction } from 'src/def/types/auction/create-auction';
import { Auction } from '../../entity/auction.entity';
import { Bidding } from '../../entity/bidding.entity';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AuctionBiddingHelperService } from '../shared/auction-bidding-helper.service';
import { AuctionStatus } from 'src/def/enums/auction_status';
import { FindAuctionsOptions, PaginationQuery } from 'src/def/pagination-query';
import moment from 'moment';
import { User } from 'src/entity/user.entity';
import { Item } from 'src/entity/item.entity';
import { x } from 'joi';
import { ConfigService } from '@nestjs/config';
import { PokApiService } from '../external/pok-api.service';

@Injectable()
export class AuctionsService {
  private readonly logger = new Logger(AuctionsService.name);
  private readonly merchantId: string;
  constructor(
    @InjectRepository(Auction)
    private auctionsRepository: Repository<Auction>,
    private helperService: AuctionBiddingHelperService,

    @Inject()
    private readonly pokApiService: PokApiService,
    private readonly configService: ConfigService,
  ) {
    this.merchantId = this.configService.get<string>('POK_MERCHANT_ID') ?? '';
  }

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

  private async determineAuctionResult(auction: Auction): Promise<{
    winningBid: Bidding | null;
    winner: User | null;
    winningAmount: number;
  }> {
    const highestBid = await this.helperService.getHighestBid(auction);
    const winningAmount = highestBid?.amount ?? auction.startingPrice;
    const winner = highestBid?.bidder ?? null; // User or null

    return {
      winningBid: highestBid ?? null,
      winner,
      winningAmount,
    };
  }

  private async findAuctionsPagination({
    qs = '',
    pageSize,
    page,
    status,
    sellerId,
    bidderId,
    relations = [],
  }: FindAuctionsOptions): Promise<{ data: Auction[]; meta: any }> {
    const take = Number(pageSize) || 9;
    const skip = ((Number(page) || 1) - 1) * take;
    const where: FindOptionsWhere<Auction> = {};

    if (sellerId) {
      where.item = { sellerId };
    }

    if (bidderId) {
      where.biddings = { bidderId };
    }

    if (status && status !== 'all') {
      where.status = status;
    }

    if (qs) {
      if (!where.item) {
        where.item = { title: ILike(`%${qs}%`) };
      } else {
        where.item = {
          ...(where.item as FindOptionsWhere<Item>),
          title: ILike(`%${qs}%`),
        };
      }
    }

    const [data, total] = await this.auctionsRepository.findAndCount({
      where,
      relations,
      order: { startingPrice: 'ASC' },
      take,
      skip,
    });

    return {
      data,
      meta: {
        total,
        page: Number(page),
        pageSize: take,
        totalPages: Math.ceil(total / take),
      },
    };
  }

  async create(
    createAuction: CreateAuction,
    ownerId: string,
  ): Promise<Auction> {
    const { startingPrice, endTime, itemId } = createAuction;
    const now = moment();
    const maxAllowedEndTime = moment().add(30, 'days');

    if (moment(endTime).isAfter(maxAllowedEndTime)) {
      throw new Error('Auction End Time cannot be more than 30 days from now.');
    }

    if (moment(endTime).isBefore(now)) {
      throw new Error('Auction End Time cannot be in the past!');
    }

    const auction = this.auctionsRepository.create({
      startingPrice,
      endTime,
      currentPrice: startingPrice,
      itemId,
      ownerId,
    });
    return this.auctionsRepository.save(auction);
  }

  async findAll(query: PaginationQuery, status?: string) {
    return this.findAuctionsPagination({
      ...query,
      status,
      relations: ['item', 'item.seller', 'winningBid', 'winningBid.bidder'],
    });
  }

  async findMyAuctionsAsBidder(
    query: PaginationQuery,
    bidderId?: string,
    status?: string,
  ) {
    return this.findAuctionsPagination({
      ...query,
      bidderId,
      status,
      relations: [
        'item',
        'item.seller',
        'biddings',
        'biddings.bidder',
        'winningBid',
        'winningBid.bidder',
      ],
    });
  }

  async findMyAuctionsAsSeller(
    query: PaginationQuery,
    sellerId?: string,
    status?: string,
  ) {
    return this.findAuctionsPagination({
      ...query,
      sellerId,
      status,
      relations: ['item', 'item.seller', 'biddings'],
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

    if (currentUserId && currentUserId !== auction?.item?.seller?.id) {
      throw new UnauthorizedException(
        'Only the owner of the auction can close it!',
      );
    }

    if (auction.status === AuctionStatus.FINISHED) {
      throw new BadRequestException('Auction has already finished');
    }

    this.logger.log('Before determining winner: ');

    const { winningBid, winner, winningAmount } =
      await this.determineAuctionResult(auction);
    this.logger.log('Winning Bid: ', winningBid);

    if (winningBid) {
      auction.winningBid = winningBid;
      // Capture money of winner
      if (winningBid?.transaction && winningBid?.transaction?.sdkOrderId) {
        const sdkOrderId = winningBid?.transaction?.sdkOrderId;
        console.log(sdkOrderId, 'Entereeeeeee');
        try {
          await this.pokApiService.capture(this.merchantId, sdkOrderId, {
            amount: winningBid?.amount,
          });
        } catch (err) {
          this.logger.error('Capturing winner: ', err);
        }
      }
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
