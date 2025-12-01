import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  JoinColumn,
  OneToOne,
} from 'typeorm';
import { TransactionStatus } from '../def/enums/transaction_status';
import { Bidding } from './bidding.entity';

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, nullable: true }) // remove nullable later (testing purpose)
  sdkOrderId: string;

  @Column({ type: 'enum', enum: TransactionStatus })
  status: TransactionStatus;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ nullable: true, type: 'timestamp' })
  cancelledAt?: Date;

  @OneToOne(() => Bidding, (bidding) => bidding.transaction, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'biddingId' })
  bidding: Bidding;
}
