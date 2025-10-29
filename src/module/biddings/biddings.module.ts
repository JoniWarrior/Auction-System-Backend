import { Module } from '@nestjs/common';
import { BiddingsService } from './biddings.service';
import { BiddingsController } from './biddings.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Bidding } from '../../entity/bidding.entity';
import { Auction } from '../../entity/auction.entity';
import { User } from '../../entity/user.entity';
import { AuctionsModule } from '../auctions/auctions.module';
import { BiddingsGateway } from './biddings-gateway';
import { UsersModule } from '../users/users.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { SharedModule } from '../shared/shared.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Bidding, Auction, User]),
    AuctionsModule,
    UsersModule,
    NotificationsModule,
    SharedModule
  ],
  controllers: [BiddingsController],
  providers: [BiddingsService, BiddingsGateway],
  exports: [BiddingsService],
})
export class BiddingsModule {}
