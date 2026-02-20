import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Expense } from './expense.entity';
import { User } from './user.entity';

@Entity({ name: 'expense_payers' })
export class ExpensePayer {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  expenseId!: string;

  @Column()
  userId!: string;

  @Column({ type: 'decimal', precision: 14, scale: 2 })
  amount!: string;

  @ManyToOne(() => Expense, (expense: Expense) => expense.payers, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'expenseId' })
  expense!: Expense;

  @ManyToOne(() => User, (user: User) => user.expensesPaid, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user!: User;
}
