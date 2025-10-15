import { Module } from '@nestjs/common';
import { AuctionsService } from './auctions.service';
import { AuctionsController } from './auctions.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Auction } from '../../entities/auction.entity';
import { Item } from '../../entities/item.entity';
import { Bidding } from '../../entities/bidding.entity';
import { JwtAuthModule } from '../../auth/guards/jwt-auth.module';
import { ItemsModule } from 'src/modules/items/items.module';
import { SharedModule } from '../shared/shared.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Auction, Item, Bidding]),
    JwtAuthModule,
    ItemsModule,
    SharedModule,
  ],
  controllers: [AuctionsController],
  providers: [AuctionsService],
  exports: [AuctionsService],
})
export class AuctionsModule {}
