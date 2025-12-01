// import {
//   Controller,
//   Get,
//   Post,
//   Body,
//   Patch,
//   Param,
//   Delete,
//   Query,
// } from '@nestjs/common';
// import { TransactionsService } from './transactions.service';
// import { type CreateTransaction } from '../../def/types/transaction/create-transaction.type';
// import { ValidationPipe } from '../../pipes/joi-validator.pipe';
// import Joi from 'joi';
// import { TransactionStatus } from '../../def/enums/transaction_status';
// import { type UpdateTransaction } from '../../def/types/transaction/update-transasction';
// import { PaginationQuery } from '../../def/pagination-query';
// @Controller('transactions')
// export class TransactionsController {
//   constructor(private readonly transactionsService: TransactionsService) {}
//
//   //
//   @Post()
//   create(
//     @Body(
//       ValidationPipe.from(
//         Joi.object({
//           biddingId: Joi.string().uuid().required(),
//         }),
//       ),
//     )
//     biddingId: string,
//   ) {
//     return this.transactionsService.create(biddingId);
//   }
//
//   @Get()
//   findAll(
//     @Query(
//       ValidationPipe.from(
//         Joi.object({
//           status: Joi.string()
//             .valid(...Object.values(TransactionStatus))
//             .optional(),
//           pageSize: Joi.number(),
//           page: Joi.number(),
//           qs: Joi.string().allow('').optional(),
//         }),
//       ),
//     )
//     query: PaginationQuery & { status?: string },
//   ) {
//     const { pageSize, page = 1, qs, status } = query;
//     return (
//       this.transactionsService.findAll({
//         page: Number(page),
//         pageSize: Number(pageSize) || 9,
//         qs: qs || '',
//       }),
//       status || ''
//     );
//   }
//
//   @Get(':id')
//   findOne(@Param('id') id: string) {
//     return this.transactionsService.findOne(id);
//   }
//
//   // @Patch(':id')
//   // update(
//   //   @Param('id') id: string,
//   //   @Body(
//   //     ValidationPipe.from(
//   //       Joi.object({
//   //         amount: Joi.number().required().min(0),
//   //         status: Joi.string().valid(...Object.values(TransactionStatus)),
//   //       }),
//   //     ),
//   //   )
//   //   updateTransaction: UpdateTransaction,
//   // ) {
//   //   return this.transactionsService.update(id, updateTransaction);
//   // }
//
//   @Delete(':id')
//   remove(@Param('id') id: string) {
//     return this.transactionsService.delete(id);
//   }
//
//   @Get('transaction-of-bidding/:bidId')
//   findTransactionOfBidding(@Param('id') bidId: string) {
//     return this.transactionsService.getTransactionForBidding(bidId);
//   }
//
//   @Get('transactions-of-auction/:auctionId')
//   findTransactionOfAuction(@Param('auctionId') auctionId: string) {
//     return this.transactionsService.getTransactionsOfAuction(auctionId);
//   }
// }
