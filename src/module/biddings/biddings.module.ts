import { forwardRef, Module } from '@nestjs/common';
import { BiddingsService } from './biddings.service';
import { BiddingsController } from './biddings.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Bidding } from '../../entity/bidding.entity';
import { Auction } from '../../entity/auction.entity';
import { User } from '../../entity/user.entity';
import { BiddingsGateway } from './biddings-gateway';
import { UsersModule } from '../users/users.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { SharedModule } from '../shared/shared.module';
import { AuctionsModule } from '../auctions/auctions.module';
import { Transaction } from '../../entity/transaction.entity';
import { TransactionsModule } from '../transactions/transactions.module';
import { PokApiModule } from '../external/pok-api.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Bidding, Auction, User, Transaction]),
    UsersModule,
    TransactionsModule,
    NotificationsModule,
    SharedModule,
    AuctionsModule,
    PokApiModule,
    EmailModule,
  ],
  controllers: [BiddingsController],
  providers: [BiddingsService, BiddingsGateway],
  exports: [BiddingsService],
})
export class BiddingsModule {}
