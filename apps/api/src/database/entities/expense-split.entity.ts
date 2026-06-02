import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Expense } from './expense.entity';
import { User } from './user.entity';
import { GroupMember } from './group-member.entity';

@Entity({ name: 'expense_splits' })
export class ExpenseSplit {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  expenseId!: string;

  @Column({ nullable: true })
  userId?: string;

  @Column()
  groupMemberId!: string;

  @Column({ type: 'decimal', precision: 14, scale: 2 })
  value!: string;

  @ManyToOne(() => Expense, (expense: Expense) => expense.splits, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'expenseId' })
  expense!: Expense;

  @ManyToOne(() => User, (user: User) => user.splits, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'userId' })
  user?: User;

  @ManyToOne(() => GroupMember, (groupMember: GroupMember) => groupMember.splitEntries, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'groupMemberId' })
  groupMember!: GroupMember;
}
