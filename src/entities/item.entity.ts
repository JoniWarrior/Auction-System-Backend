import { User } from './user.entity';
import { Auction } from './auction.entity';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  OneToOne,
  JoinColumn,
} from 'typeorm';

@Entity('items')
export class Item {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column()
  description: string;

  @Column({ nullable: false })
  imageURL: string;

  @ManyToOne(() => User, (user) => user.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sellerId' })
  seller: User;

  @OneToOne(() => Auction, (auction) => auction.item, { onDelete: 'CASCADE' })
  auction: Auction;

  @CreateDateColumn()
  createdAt: Date;
}
