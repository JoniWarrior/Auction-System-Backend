import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  OneToMany,
  DeleteDateColumn,
  OneToOne,
} from 'typeorm';
import { Item } from './item.entity';
import { Bidding } from './bidding.entity';
import { Auction } from './auction.entity';
import { Card } from './credit-card.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => Item, (item) => item.seller, { onDelete: 'CASCADE' })
  items: Item[];

  @OneToMany(() => Bidding, (bidding) => bidding.bidder, {
    onDelete: 'CASCADE',
  })
  biddings: Bidding[];

  @DeleteDateColumn()
  deletedAt?: Date;

  @OneToMany(() => Auction, (auction) => auction.owner, { onDelete: 'CASCADE' })
  auctions: Auction[];

  @OneToMany(() => Card, (creditCard) => creditCard.user, {
    onDelete: 'SET NULL',
  })
  creditCards: Card[];
}
