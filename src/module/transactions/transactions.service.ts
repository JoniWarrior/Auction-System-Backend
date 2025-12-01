// import {
//   forwardRef,
//   Inject,
//   Injectable,
//   Logger,
//   NotFoundException,
// } from '@nestjs/common';
// import { Transaction } from '../../entity/transaction.entity';
// import { InjectRepository } from '@nestjs/typeorm';
// import { FindOptionsWhere, Repository } from 'typeorm';
// import { BiddingsService } from '../biddings/biddings.service';
// import { TransactionStatus } from '../../def/enums/transaction_status';
// import { PaginationQuery } from '../../def/pagination-query';
// import { FindTransactionsOptions } from '../../def//pagination-query';
// @Injectable()
// export class TransactionsService {
//   constructor(
//     @InjectRepository(Transaction)
//     private readonly transactionsRepository: Repository<Transaction>,
//
//     @Inject(forwardRef(() => BiddingsService))
//     private readonly biddingsService: BiddingsService,
//   ) {}
//
//   private async findTransactionsPagination({
//     qs = '',
//     page,
//     pageSize,
//     status,
//     relations = [],
//   }: FindTransactionsOptions): Promise<{ data: Transaction[]; meta: any }> {
//     const take = Number(pageSize) || 10;
//     const skip = ((Number(page) || 1) - 1) * take;
//
//     const where: FindOptionsWhere<Transaction> = {};
//
//     if (status && status !== 'all') {
//       where.status = status;
//     }
//
//     const [data, total] = await this.transactionsRepository.findAndCount({
//       where,
//       relations,
//       order: { createdAt: 'DESC' },
//       take,
//       skip,
//     });
//
//     return {
//       data,
//       meta: {
//         total,
//         page: Number(page) || 1,
//         pageSize: take,
//         totalPages: Math.ceil(total / take),
//       },
//     };
//   }
//
//   async create(biddingId: string): Promise<Transaction> {
//     const bidding = await this.biddingsService.findOne(biddingId);
//     if (!bidding) {
//       throw new Error(`Bidding with id ${biddingId} not found`);
//     }
//
//     const existingTransactions = await this.transactionsRepository.findOne({
//       where: { bidding: { id: biddingId } },
//     });
//     if (existingTransactions) {
//       throw new Error(`Transaction already exists for bidding ${biddingId}`);
//     }
//
//     const transaction = this.transactionsRepository.create({
//       status: TransactionStatus.ON_HOLD,
//       bidding,
//     });
//     return await this.transactionsRepository.save(transaction);
//   }
//
//   findAll(query: PaginationQuery, status?: string) {
//     return this.findTransactionsPagination({
//       ...query,
//       status,
//       relations: [
//         'auction',
//         'auction.item.seller',
//         'bidding',
//         'bidding.bidder',
//       ],
//     });
//   }
//
//   async findOne(id: string): Promise<Transaction> {
//     const transaction = await this.transactionsRepository.findOne({
//       where: { id },
//     });
//     if (!transaction) throw new Error(`Transaction with id ${id} not found`);
//     return transaction;
//   }
//
//   async update(id: string, data: Partial<Transaction>): Promise<Transaction> {
//     const originalTransaction = await this.findOne(id);
//     const updatedTransaction = this.transactionsRepository.merge(
//       originalTransaction,
//       data,
//     );
//     return this.transactionsRepository.save(updatedTransaction);
//   }
//
//   async delete(id: string) {
//     const transaction = await this.transactionsRepository.findOne({
//       where: { id },
//     });
//     if (!transaction) {
//       throw new NotFoundException(`Transaction with ID ${id} not found`);
//     }
//     await this.transactionsRepository.softDelete(id);
//     return { message: `Transaction with ID ${id} has been soft-deleted` };
//   }
//
//   async getTransactionForBidding(biddingId: string) {
//     return this.transactionsRepository.findOne({
//       where: { bidding: { id: biddingId } },
//     });
//   }
//
//   async getTransactionsOfAuction(auctionId: string): Promise<Transaction[]> {
//     const transactions = await this.transactionsRepository.find({
//       where: { bidding: { auction: { id: auctionId } } },
//     });
//     return transactions;
//   }
// }
