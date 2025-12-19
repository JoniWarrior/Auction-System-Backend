import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Transaction } from '../../entity/transaction.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { PaginationQuery } from '../../def/pagination-query';
import { FindTransactionsOptions } from '../../def//pagination-query';
import { CreateTransactionDto } from '../external/types/create-transaction.dto';
import { ConfigService } from '@nestjs/config';
import { PokApiService } from '../external/pok-api.service';
import { TransactionStatus } from '../../def/enums/transaction_status';
import { Bidding } from '../../entity/bidding.entity';
import { AuctionsService } from '../auctions/auctions.service';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class TransactionsService {
  private readonly merchantId: string;
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionsRepository: Repository<Transaction>,

    @Inject()
    private readonly configService: ConfigService,
    private readonly pokApiService: PokApiService,
    private readonly auctionService: AuctionsService,
    private readonly redisService: RedisService,
  ) {
    this.merchantId = this.configService.get<string>('POK_MERCHANT_ID') ?? '';
  }

  private async findTransactionsPagination({
    qs = '',
    page,
    pageSize,
    status,
    relations = [],
  }: FindTransactionsOptions): Promise<{ data: Transaction[]; meta: any }> {
    const take = Number(pageSize) || 10;
    const skip = ((Number(page) || 1) - 1) * take;

    const where: FindOptionsWhere<Transaction> = {};

    if (status && status !== 'all') {
      where.status = status;
    }

    const [data, total] = await this.transactionsRepository.findAndCount({
      where,
      relations,
      order: { createdAt: 'DESC' },
      take,
      skip,
    });

    return {
      data,
      meta: {
        total,
        page: Number(page) || 1,
        pageSize: take,
        totalPages: Math.ceil(total / take),
      },
    };
  }

  // async create(payload: {
  //   amount: number;
  //   auctionId: string;
  //   paymentCurrency: 'ALL' | 'EUR';
  // }): Promise<Transaction> {
  //   const auction = await this.auctionService.findOne(payload.auctionId);
  //
  //   if (!auction) {
  //     throw new BadRequestException('Auction not found');
  //   }
  //
  //   if (!['ALL', 'EUR'].includes(payload.paymentCurrency)) {
  //     throw new BadRequestException('Unsupported currency');
  //   }
  //
  //   const transactionPayload: CreateTransactionDto = {
  //     amount: payload.amount,
  //     currencyCode: payload.paymentCurrency,
  //     autoCapture: false,
  //     description: `Bidding for auction ${payload.auctionId}`,
  //     merchantCustomReference: this.merchantId,
  //     webhookUrl: process.env.WEBHOOK_PROXY_URL,
  //     products: [
  //       {
  //         name: auction.item?.title,
  //         quantity: 1,
  //         price: payload.amount,
  //       },
  //     ],
  //   };
  //
  //   const response =
  //     await this.pokApiService.createTransaction(transactionPayload);
  //   const sdkOrder = response.data.sdkOrder;
  //
  //   return this.transactionsRepository.save({
  //     sdkOrderId: sdkOrder.id,
  //     paymentCurrency: payload.paymentCurrency,
  //     originalAmount: payload.amount,
  //     finalAmount: sdkOrder.finalAmount, // ALL
  //     appliedExchangeRate: sdkOrder.appliedExchangeRate,
  //     status: TransactionStatus.ON_HOLD,
  //   });
  // }

  async create(payload: {
    amount: number;
    auctionId: string;
    paymentCurrency: 'ALL' | 'EUR';
  }): Promise<Transaction> {
    const auction = await this.auctionService.findOne(payload.auctionId);

    if (!auction) {
      throw new BadRequestException('Auction not found');
    }

    if (!['ALL', 'EUR'].includes(payload.paymentCurrency)) {
      throw new BadRequestException('Unsupported currency');
    }

    const transactionPayload: CreateTransactionDto = {
      amount: payload.amount,
      currencyCode: payload.paymentCurrency,
      autoCapture: false,
      description: `Bidding for auction ${payload.auctionId}`,
      merchantCustomReference: this.merchantId,
      webhookUrl: process.env.WEBHOOK_PROXY_URL,
      products: [
        {
          name: auction.item?.title || 'Auction Item',
          quantity: 1,
          price: payload.amount,
        },
      ],
    };

    const response =
      await this.pokApiService.createTransaction(transactionPayload);
    const sdkOrder = response.data.sdkOrder;

    const transaction = this.transactionsRepository.create({
      sdkOrderId: sdkOrder.id,
      paymentCurrency: payload.paymentCurrency,
      originalAmount: sdkOrder.originalAmount ?? payload.amount,
      finalAmount: sdkOrder.finalAmount ?? payload.amount,
      appliedExchangeRate: sdkOrder.appliedExchangeRate ?? 1,
      status: TransactionStatus.ON_HOLD,
    });

    return this.transactionsRepository.save(transaction);
  }

  async updateAndCancelTransaction(
    currentTransaction: string,
    bidding: Bidding,
    previousTransaction?: string,
  ): Promise<any> {
    // 1. Cancel previous transaction
    console.log(
      'Bidding coming from updateAndCancelTransaction method: ',
      bidding,
    );
    console.log(
      'Beginning to cancel previous transaction with sdkOrderId: ',
      previousTransaction,
    );

    if (previousTransaction) {
      const cancellationReason = `Outbid by ${bidding.bidder?.name} with value ${bidding?.amount} for auction ${bidding?.auction?.id}`;
      try {
        await this.pokApiService.cancelTransaction(
          this.merchantId,
          previousTransaction, // sdkOrderId
          cancellationReason,
        );
      } catch (err) {
        console.error(err);
        throw new InternalServerErrorException('Could not cancel transaction!');
      }
    }

    // 2. Save new bid relation to the current transaction, change status to success
    return this.redisService.withResourceLock(currentTransaction, async () => {
      const transaction = await this.transactionsRepository.findOne({
        where: { id: currentTransaction },
      });
      if (!transaction)
        throw new NotFoundException(
          `Transaction with id ${currentTransaction} not found`,
        );
      transaction.bidding = bidding;
      transaction.status = TransactionStatus.SUCCESS;
      await this.transactionsRepository.save(transaction);
    });
  }

  async findAll(query: PaginationQuery, status?: string) {
    return this.findTransactionsPagination({
      ...query,
      status,
      relations: [
        'auction',
        'auction.item.seller',
        'bidding',
        'bidding.bidder',
      ],
    });
  }

  async findOne(id: string): Promise<Transaction> {
    const transaction = await this.transactionsRepository.findOne({
      where: { id },
    });
    if (!transaction) throw new Error(`Transaction with id ${id} not found`);
    return transaction;
  }

  async update(id: string, data: Partial<Transaction>): Promise<Transaction> {
    const originalTransaction = await this.findOne(id);
    const updatedTransaction = this.transactionsRepository.merge(
      originalTransaction,
      data,
    );
    return this.transactionsRepository.save(updatedTransaction);
  }

  async delete(id: string) {
    const transaction = await this.transactionsRepository.findOne({
      where: { id },
    });
    if (!transaction) {
      throw new NotFoundException(`Transaction with ID ${id} not found`);
    }
    await this.transactionsRepository.softDelete(id);
    return { message: `Transaction with ID ${id} has been soft-deleted` };
  }

  async getTransactionForBidding(biddingId: string) {
    return this.transactionsRepository.findOne({
      where: { bidding: { id: biddingId } },
    });
  }
}
