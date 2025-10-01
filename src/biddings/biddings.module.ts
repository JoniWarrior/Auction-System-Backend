import { Module, forwardRef} from '@nestjs/common';
import { BiddingsService } from './biddings.service';
import { BiddingsController } from './biddings.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Bidding } from './entities/bidding.entity';
import { Auction } from './../auctions/entities/auction.entity';
import { User } from './../users/entities/user.entity';
import { JwtAuthModule } from "./../auth/guards/jwt-auth.module";
import { AuctionsModule } from './../auctions/auctions.module';
import { BiddingsGateway } from './biddings-gateway';
import { UsersModule } from './../users/users.module';
import { NotificationsModule } from './../notifications/notifications.module';

@Module({
  imports : [TypeOrmModule.forFeature([Bidding, Auction, User]), 
  forwardRef(() => AuctionsModule),
  forwardRef(() => UsersModule),
  NotificationsModule,
  JwtAuthModule],
  controllers: [BiddingsController],
  providers: [BiddingsService, BiddingsGateway],
  exports : [BiddingsService]
})
export class BiddingsModule {}