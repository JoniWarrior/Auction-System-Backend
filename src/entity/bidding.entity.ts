import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  DeleteDateColumn,
  OneToOne,
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

  @CreateDateColumn()
  createdAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
}
