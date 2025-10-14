import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './modules/users/users.module';
import { ItemsModule } from './modules/items/items.module';
import { BiddingsModule } from './modules/biddings/biddings.module';
import { AuctionsModule } from './modules/auctions/auctions.module';
import { AuthModule } from './auth/auth.module';
import { ScheduleModule } from '@nestjs/schedule';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ConfigModul } from './dynamic-modules/Config.module';
import { DBModule } from './dynamic-modules/DB.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModul,
    DBModule,
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
