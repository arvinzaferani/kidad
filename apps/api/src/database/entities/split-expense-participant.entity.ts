import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { SplitExpense } from './split-expense.entity';
import { SplitMember } from './split-member.entity';

@Entity({ name: 'split_expense_participants' })
@Unique(['expenseId', 'memberId'])
export class SplitExpenseParticipant {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  expenseId!: string;

  @Column()
  memberId!: string;

  @Column({ type: 'decimal', precision: 14, scale: 2 })
  value!: string;

  @ManyToOne(() => SplitExpense, (expense) => expense.participants, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'expenseId' })
  expense!: SplitExpense;

  @ManyToOne(() => SplitMember, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'memberId' })
  member!: SplitMember;
}