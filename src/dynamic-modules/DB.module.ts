import { TypeOrmModule } from '@nestjs/typeorm';
import { Auction } from 'src/entities/auction.entity';
import { Bidding } from 'src/entities/bidding.entity';
import { Item } from 'src/entities/item.entity';
import { User } from 'src/entities/user.entity';
import { Notification } from 'src/notifications/notifications-entity';

export const DBModule = TypeOrmModule.forRoot({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  entities: [User, Item, Bidding, Auction, Notification],
  synchronize: true,
});
