import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Currency, SplitType } from './enums';
import { SplitSession } from './split-session.entity';
import { SplitMember } from './split-member.entity';
import { SplitExpensePayer } from './split-expense-payer.entity';
import { SplitExpenseParticipant } from './split-expense-participant.entity';

@Entity({ name: 'split_expenses' })
export class SplitExpense {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  sessionId!: string;

  @Column()
  description!: string;

  @Column({ type: 'decimal', precision: 14, scale: 2 })
  amount!: string;

  @Column({ type: 'enum', enum: Currency, default: Currency.TOMAN })
  currency!: Currency;

  @Column({ type: 'enum', enum: SplitType, default: SplitType.EQUAL })
  splitType!: SplitType;

  @Column()
  addedByMemberId!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @ManyToOne(() => SplitSession, (session) => session.expenses, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'sessionId' })
  session!: SplitSession;

  @ManyToOne(() => SplitMember, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'addedByMemberId' })
  addedBy!: SplitMember;

  @OneToMany(
    () => SplitExpenseParticipant,
    (participant) => participant.expense,
    { cascade: true },
  )
  participants!: SplitExpenseParticipant[];

  @OneToMany(
    () => SplitExpensePayer,
    (payer) => payer.expense,
    { cascade: true },
  )
  payers!: SplitExpensePayer[];
}