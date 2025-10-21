import { TypeOrmModule } from '@nestjs/typeorm';
import { Auction } from 'src/entity/auction.entity';
import { Bidding } from 'src/entity/bidding.entity';
import { Item } from 'src/entity/item.entity';
import { User } from 'src/entity/user.entity';
import { Notification } from 'src/entity/notifications.entity';

export const DB = TypeOrmModule.forRoot({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  entities: [User, Item, Bidding, Auction, Notification],
  synchronize: false,
});
