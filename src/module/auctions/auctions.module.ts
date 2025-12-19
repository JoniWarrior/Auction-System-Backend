import { Module } from '@nestjs/common';
import { AuctionsService } from './auctions.service';
import { AuctionsController } from './auctions.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Auction } from '../../entity/auction.entity';
import { Item } from '../../entity/item.entity';
import { Bidding } from '../../entity/bidding.entity';
import { ItemsModule } from 'src/module/items/items.module';
import { SharedModule } from '../shared/shared.module';
import { PokApiModule } from '../external/pok-api.module';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Auction, Item, Bidding]),
    ItemsModule,
    SharedModule,
    PokApiModule,
  ],
  controllers: [AuctionsController],
  providers: [AuctionsService],
  exports: [AuctionsService],
})
export class AuctionsModule {}
