import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Transaction } from '../../entity/transaction.entity';
import { AuctionsModule } from '../auctions/auctions.module';
import { BiddingsModule } from '../biddings/biddings.module';
@Module({
  imports: [
    TypeOrmModule.forFeature([Transaction]),
    AuctionsModule,
    forwardRef(() => BiddingsModule), // remove forwardRef later!
  ],
  controllers: [],
  providers: [],
  exports: [],
})
export class TransactionsModule {}
