import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateBidding } from 'src/def/types/bidding/create-bidding.type';
import { UpdateBidding } from 'src/def/types/bidding/update-bidding.type';
import { InjectRepository } from '@nestjs/typeorm';
import { Bidding } from '../../entity/bidding.entity';
import { ILike, Repository } from 'typeorm';
import { BiddingsGateway } from './biddings-gateway';
import { AuctionBiddingHelperService } from '../shared/auction-bidding-helper.service';
import { PaginationQuery } from 'src/def/pagination-query';
import { ConfigService } from '@nestjs/config';
import { EmailService } from '../email/email.service';
import { UsersService } from '../users/users.service';
import { RedisService } from '../redis/redis.service';
import { TransactionsService } from '../transactions/transactions.service';
import { Transaction } from '../../entity/transaction.entity';

@Injectable()
export class BiddingsService {
  private readonly merchantId: string;
  constructor(
    @InjectRepository(Bidding)
    private biddingsRepository: Repository<Bidding>,

    @Inject()
    private readonly biddingsGateway: BiddingsGateway,
    private readonly helperService: AuctionBiddingHelperService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
    private readonly userService: UsersService,
    private readonly redisService: RedisService,
    private readonly transactionsService: TransactionsService,
  ) {
    this.merchantId = this.configService.get<string>('POK_MERCHANT_ID') ?? '';
  }

  private async broadcastEvents(
    auctionId: string,
    result: {
      bidding: Bidding;
      previousBidderId: string | null;
      previousBidderEmail: string | null;
    },
  ) {
    this.biddingsGateway.broadcastNewBid(auctionId, result.bidding);

    if (result.previousBidderId) {
      await this.biddingsGateway.broadcastOutBid(auctionId, result.bidding, [
        result.previousBidderId,
      ]);

      if (result.previousBidderEmail) {
        await this.emailService.sendOutBidEmail(result.previousBidderEmail, {
          auctionTitle: result.bidding.auction?.item?.title,
          newBidAmount: result.bidding.amount,
        });
      }
    }
  }

  private async validateBidRules(
    currentHighestBid: Bidding | null,
    bidderId: string,
    currentPrice: number,
    bidAmount: number,
  ) {
    if (currentHighestBid?.bidder?.id === bidderId) {
      throw new BadRequestException('You already have the highest bid');
    }
    if (currentHighestBid && bidAmount <= currentPrice) {
      throw new BadRequestException(
        'Bid must be higher than current highest bid',
      );
    }
  }

  private async saveBid(
    transaction: Transaction,
    auctionId: string,
    bidderId: string,
    relations: string[],
  ) {
    const bid = await this.biddingsRepository.save({
      amount: transaction.finalAmount,
      currency: transaction.paymentCurrency,
      auctionId,
      bidderId,
      transaction,
    });
    return this.biddingsRepository.findOneOrFail({
      where: { id: bid.id },
      relations,
    });
  }

  private async buildResult(
    bidding: Bidding,
    currentHighestBid: Bidding | null,
    auctionId: string,
  ) {
    return {
      bidding,
      previousTransaction: currentHighestBid?.transaction?.sdkOrderId ?? null,
      previousBidderEmail: currentHighestBid?.bidder?.email ?? null,
      previousBidderId: currentHighestBid?.bidder?.id ?? null,
      auctionId,
    };
  }

  async create(createBidding: CreateBidding, bidderId: string): Promise<any> {
    const { auctionId, transactionId } = createBidding;
    const result = await this.redisService.withResourceLock(
      auctionId,
      async () => {
        const auction = await this.helperService.validateAuctionForBidding(
          auctionId,
          bidderId,
        );

        const bidder = await this.userService.findOne(bidderId);
        if (!bidder) throw new NotFoundException('Bidder not found');
        const transaction =
          await this.transactionsService.findOne(transactionId);
        const currentHighestBid =
          await this.helperService.getHighestBid(auction);

        await this.validateBidRules(
          currentHighestBid,
          bidderId,
          auction.currentPrice,
          transaction.finalAmount,
        );
        const bid = await this.saveBid(transaction, auctionId, bidderId, [
          'auction',
          'bidder',
          'transaction',
          'auction.item',
        ]);
        await this.helperService.updateAuction(auction, {
          amount: transaction.finalAmount,
          isFirstBid: !currentHighestBid,
        });
        return await this.buildResult(bid, currentHighestBid, auctionId);
      },
    );
    await this.broadcastEvents(auctionId, result);

    return {
      bidding: result.bidding,
      previousTransaction: result.previousTransaction,
    };
  }

  async findAll({ qs, pageSize, page }: PaginationQuery): Promise<Bidding[]> {
    return this.biddingsRepository.find({
      where: { bidder: { name: ILike(`%${qs}%`) } },
      relations: ['auction', 'bidder'],
      take: pageSize,
      skip: (page - 1) * pageSize,
      order: { amount: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Bidding> {
    const bidding = await this.biddingsRepository.findOne({
      where: { id },
      relations: ['auction', 'bidder'],
    });
    if (!bidding)
      throw new NotFoundException(`Bidding with ID ${id} not found`);
    return bidding;
  }

  async findMyBiddings(id: string): Promise<Bidding[]> {
    return this.findBidsByBider(id);
  }

  async update(id: string, updateBidding: UpdateBidding): Promise<Bidding> {
    const bidding = await this.findOne(id);
    const updatedBidding = this.biddingsRepository.merge(
      bidding,
      updateBidding,
    );
    return this.biddingsRepository.save(updatedBidding);
  }

  async delete(id: string) {
    const existingBid = await this.biddingsRepository.findOne({
      where: { id },
    });
    if (!existingBid)
      throw new NotFoundException(`Bidding with Id: ${id} not found!`);
    await this.biddingsRepository.softDelete(id);
    return { message: `Bidding ${id} has been soft-deleted` };
  }

  async findByAuction(auctionId: string): Promise<Bidding[]> {
    return this.biddingsRepository.find({
      where: { auctionId },
      relations: ['bidder'],
      order: { amount: 'DESC' },
    });
  }

  async findBidsByBider(bidderId: string): Promise<Bidding[]> {
    return this.biddingsRepository.find({
      where: {
        bidderId,
      },
      relations: ['auction', 'auction.item', 'auction.item.seller'],
    });
  }
}
