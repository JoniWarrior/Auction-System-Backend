import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { ItemsModule } from './items/items.module';
import { BiddingsModule } from './biddings/biddings.module';
import { AuctionsModule } from './auctions/auctions.module';
import { AuthModule } from './auth/auth.module';
import { ScheduleModule } from '@nestjs/schedule';
import { NotificationsModule } from './notifications/notifications.module';
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
