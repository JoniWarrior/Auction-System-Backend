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
import { CONFIG } from './dynamic-module/CONFIG';
import { DB } from './dynamic-module/db';

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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
