import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { TypeOrmModule} from "@nestjs/typeorm";
import { User } from "./users/entities/user.entity";
import { Item } from "./items/entities/item.entity";
import { Bidding } from './biddings/entities/bidding.entity';
import { Auction } from './auctions/entities/auction.entity';
import { Notification } from './notifications/notifications-entity';
import { ItemsModule } from './items/items.module';
import { BiddingsModule } from './biddings/biddings.module';
import { AuctionsModule } from './auctions/auctions.module';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { ScheduleModule } from '@nestjs/schedule';
import { NotificationsModule } from './notifications/notifications.module';



@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({isGlobal : true}),
    TypeOrmModule.forRoot({
      type : "postgres",
      host : process.env.DB_HOST,
      port : Number(process.env.DB_PORT), 
      username : process.env.DB_USERNAME,
      password : process.env.DB_PASS,
      database : process.env.DB_NAME,
      entities : [User, Item, Bidding, Auction, Notification],
      synchronize : true,
    }), 
    UsersModule, ItemsModule, BiddingsModule, AuctionsModule, AuthModule, NotificationsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
