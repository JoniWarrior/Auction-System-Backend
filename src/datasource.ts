import { DataSource, DefaultNamingStrategy } from 'typeorm';
import * as dotenv from 'dotenv';
import { User } from './entity/user.entity';
import { Item } from './entity/item.entity';
import { Auction } from './entity/auction.entity';
import { Bidding } from './entity/bidding.entity';
import { Notification } from './entity/notifications.entity';
import { Transaction } from './entity/transaction.entity';
import { Card } from './entity/credit-card.entity';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  entities: [User, Item, Notification, Auction, Bidding, Transaction, Card],
  migrations: ['src/migrations/*.ts'],
  synchronize: false,
  namingStrategy: new DefaultNamingStrategy(),
});
