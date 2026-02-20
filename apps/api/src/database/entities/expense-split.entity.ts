import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Expense } from './expense.entity';
import { User } from './user.entity';

@Entity({ name: 'expense_splits' })
export class ExpenseSplit {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  expenseId!: string;

  @Column()
  userId!: string;

  @Column({ type: 'decimal', precision: 14, scale: 2 })
  value!: string;

  @ManyToOne(() => Expense, (expense: Expense) => expense.splits, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'expenseId' })
  expense!: Expense;

  @ManyToOne(() => User, (user: User) => user.splits, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user!: User;
}
