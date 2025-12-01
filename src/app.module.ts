import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './module/users/users.module';
import { ItemsModule } from './module/items/items.module';
import { BiddingsModule } from './module/biddings/biddings.module';
import { AuctionsModule } from './module/auctions/auctions.module';
import { AuthModule } from './auth/auth.module';
import { ScheduleModule } from '@nestjs/schedule';
import { NotificationsModule } from './module/notifications/notifications.module';
import { CONFIG } from './dynamic-module/config';
import { DB } from './dynamic-module/db';
import { TransactionsModule } from './module/transactions/transactions.module';
import { PokApiModule } from './module/external/pok-api.module';
import { Card } from './entity/credit-card.entity';
import { CardsModule } from './module/cards/cards.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    CONFIG,
    DB,
    UsersModule,
    ItemsModule,
    BiddingsModule,
    AuctionsModule,
    AuthModule,
    NotificationsModule,
    TransactionsModule,
    PokApiModule,
    CardsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
