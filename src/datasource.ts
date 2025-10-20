import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { User } from './entities/user.entity';
import { Item } from './entities/item.entity';
import { Auction } from './entities/auction.entity';
import { Bidding } from './entities/bidding.entity';
import { Notification } from './entities/notifications.entity';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  entities: [User, Item, Notification, Auction, Bidding],
  migrations: ['src/migrations/*.ts'],
  synchronize: false,
});
