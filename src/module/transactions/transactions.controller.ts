import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { ValidationPipe } from '../../pipes/joi-validator.pipe';
import Joi from 'joi';
import { TransactionStatus } from '../../def/enums/transaction_status';
import { PaginationQuery } from '../../def/pagination-query';
import { JwtAuthGuard } from '../../auth/guard/jwt-auth.guard';
import { CurrentLoggedInUser } from '../../decorator/current-user.decorator';

@Controller('transactions')
@UseGuards(JwtAuthGuard)
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  create(
    @Body()
    payload: {
      amount: number;
      auctionId: string;
      paymentCurrency: 'ALL' | 'EUR';
    },
    @CurrentLoggedInUser() user: any,
  ) {
    return this.transactionsService.create(payload);
  }

  @Post('/update-cancel')
  updateAndCancelTransaction(
    @Body()
    payload: {
      previousTransaction: string;
      currentTransaction: string;
      bidding: any;
    },
  ) {
    return this.transactionsService.updateAndCancelTransaction(
      payload.currentTransaction,
      payload.bidding,
      payload.previousTransaction,
    );
  }

  @Get()
  findAll(
    @Query(
      ValidationPipe.from(
        Joi.object({
          status: Joi.string()
            .valid(...Object.values(TransactionStatus))
            .optional(),
          pageSize: Joi.number(),
          page: Joi.number(),
          qs: Joi.string().allow('').optional(),
        }),
      ),
    )
    query: PaginationQuery & { status?: string },
  ) {
    const { pageSize, page = 1, qs, status } = query;
    return (
      this.transactionsService.findAll({
        page: Number(page),
        pageSize: Number(pageSize) || 9,
        qs: qs || '',
      }),
      status || ''
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.transactionsService.findOne(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.transactionsService.delete(id);
  }

  @Get('transaction-of-bidding/:bidId')
  findTransactionOfBidding(@Param('id') bidId: string) {
    return this.transactionsService.getTransactionForBidding(bidId);
  }
}
