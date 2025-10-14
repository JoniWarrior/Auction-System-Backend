import { Module, forwardRef} from '@nestjs/common';
import { BiddingsService } from '../biddings/biddings.service';
import { BiddingsController } from '../biddings/biddings.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Bidding } from '../entities/bidding.entity';
import { Auction } from '../entities/auction.entity';
import { User } from '../entities/user.entity';
import { JwtAuthModule } from "../auth/guards/jwt-auth.module";
import { AuctionsModule } from './auctions.module';
import { BiddingsGateway } from '../biddings/biddings-gateway';
import { UsersModule } from './users.module';
import { NotificationsModule } from './notifications.module';

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