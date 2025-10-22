import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  OneToOne,
  OneToMany,
  JoinColumn,
  Index,
  DeleteDateColumn,
} from 'typeorm';
import { Item } from './item.entity';
import { Bidding } from './bidding.entity';
import { AuctionStatus } from "../def/enums/auction_status";

@Entity('auctions')
@Index(['status', 'endTime'])
export class Auction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  startingPrice: number;

  @Column({ nullable: false })
  currentPrice: number;

  @Column()
  endTime: Date;

  @Column({ type: 'enum', enum: AuctionStatus, default: AuctionStatus.PENDING })
  status: AuctionStatus;

  @CreateDateColumn()
  createdAt: Date;

  @OneToOne(() => Item, (item) => item.auction)
  @JoinColumn({ name: 'itemId' })
  item: Item;

  @Column({name : "itemId"})
  readonly itemId : string

  @OneToMany(() => Bidding, (bidding) => bidding.auction, {
    onDelete: 'CASCADE',
  })
  biddings: Bidding[];

  @OneToOne(() => Bidding, { nullable: true })
  @JoinColumn({ name: 'winnerBidId' })
  winningBid: Bidding;

  @Column({name : "winnerBidId", nullable : true})
  readonly winningBidId : string

  @DeleteDateColumn()
  deletedAt?: Date;
}
