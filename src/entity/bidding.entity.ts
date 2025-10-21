import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Auction } from './auction.entity';
import { User } from './user.entity';

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

  @ManyToOne(() => User, (bidder) => bidder.biddings, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'bidderId' })
  bidder: User;

  @CreateDateColumn()
  createdAt: Date;
}
