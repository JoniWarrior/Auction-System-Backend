import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { Item } from './item.entity';
import { Bidding } from './bidding.entity';
import { UserRole } from '../def/enums/user_role.enum';

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

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.BIDDER,
  })
  role: UserRole;

  @CreateDateColumn()
  created_at: Date;

  @OneToMany(() => Item, (item) => item.seller, { onDelete: 'CASCADE' })
  items: Item[];

  @OneToMany(() => Bidding, (bidding) => bidding.bidder, {
    onDelete: 'CASCADE',
  })
  biddings: Bidding[];
}
