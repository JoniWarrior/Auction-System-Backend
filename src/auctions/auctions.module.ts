import { Module, forwardRef } from '@nestjs/common';
import { AuctionsService } from './auctions.service';
import { AuctionsController } from './auctions.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Auction } from './entities/auction.entity';
import { Item } from './../items/entities/item.entity';
import { Bidding } from './../biddings/entities/bidding.entity';
import { JwtAuthModule } from './../auth/guards/jwt-auth.module';
import { BiddingsModule } from './../biddings/biddings.module';

@Module({
  imports : [TypeOrmModule.forFeature([Auction, Item, Bidding]),
  JwtAuthModule,
  forwardRef(() => BiddingsModule)
],
  controllers: [AuctionsController],
  providers: [AuctionsService],
  exports : [AuctionsService]
})
export class AuctionsModule {}
