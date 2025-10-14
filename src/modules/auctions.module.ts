import { Module, forwardRef } from '@nestjs/common';
import { AuctionsService } from '../auctions/auctions.service';
import { AuctionsController } from '../auctions/auctions.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Auction } from '../entities/auction.entity';
import { Item } from '../entities/item.entity';
import { Bidding } from '../entities/bidding.entity';
import { JwtAuthModule } from '../auth/guards/jwt-auth.module';
import { BiddingsModule } from './biddings.module';
import { ItemsModule } from 'src/modules/items.module';

@Module({
  imports : [TypeOrmModule.forFeature([Auction, Item, Bidding]),
  JwtAuthModule,
  ItemsModule,
  forwardRef(() => BiddingsModule)
],
  controllers: [AuctionsController],
  providers: [AuctionsService],
  exports : [AuctionsService]
})
export class AuctionsModule {}
