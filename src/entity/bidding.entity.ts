import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Auction } from './auction.entity';
import { User } from './user.entity';
import { Transaction } from './transaction.entity';

@Entity('biddings')
export class Bidding {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  amount: number;

  @ManyToOne(() => Auction, (auction) => auction.biddings, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'auctionId' })
  auction: Auction;

  @Column({ name: 'auctionId' })
  auctionId: string;

  @ManyToOne(() => User, (bidder) => bidder.biddings, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'bidderId' })
  bidder: User;

  @Column({ name: 'bidderId' })
  readonly bidderId: string;

  @OneToOne(() => Transaction, (transaction) => transaction.bidding, {
    onDelete: 'CASCADE',
  })
  transaction: Transaction;

  @Column() // for now
  currency: string;

  @CreateDateColumn()
  createdAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
}
