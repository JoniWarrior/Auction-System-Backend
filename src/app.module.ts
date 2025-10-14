import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './modules/users.module';
import { ItemsModule } from './modules/items.module';
import { BiddingsModule } from './modules/biddings.module';
import { AuctionsModule } from './modules/auctions.module';
import { AuthModule } from './auth/auth.module';
import { ScheduleModule } from '@nestjs/schedule';
import { NotificationsModule } from './modules/notifications.module';
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
