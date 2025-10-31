import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  OneToMany,
  DeleteDateColumn,
} from 'typeorm';
import { Item } from './item.entity';
import { Bidding } from './bidding.entity';

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
}
