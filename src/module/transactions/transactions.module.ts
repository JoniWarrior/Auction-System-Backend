import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Transaction } from '../../entity/transaction.entity';
import { AuctionsModule } from '../auctions/auctions.module';
import { PokApiModule } from '../external/pok-api.module';
import { TransactionsService } from './transactions.service';
import { TransactionsController } from './transactions.controller';
import { RedisService } from '../redis/redis.service';
import { RedisModule } from '../redis/redis.module';
@Module({
  imports: [
    TypeOrmModule.forFeature([Transaction]),
    AuctionsModule,
    PokApiModule,
    RedisModule,
  ],
  controllers: [TransactionsController],
  providers: [TransactionsService],
  exports: [TransactionsService],
})
export class TransactionsModule {}
