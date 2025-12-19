import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
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
    nullable: true, // is null at first before payment confirm
  })
  @JoinColumn({ name: 'biddingId' })
  bidding: Bidding;

  @Column() // add nullable later
  paymentCurrency: string; // ALL / EUR from user choice in front

  @Column({ type: 'decimal' }) // remove nullable : true later
  originalAmount: number;

  @Column({ type: 'decimal' })
  finalAmount: number;

  @Column({ type: 'decimal' })
  appliedExchangeRate: number;
}
