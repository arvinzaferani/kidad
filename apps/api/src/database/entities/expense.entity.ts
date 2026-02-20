import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Group } from './group.entity';
import { Currency, SplitType } from './enums';
import { ExpensePayer } from './expense-payer.entity';
import { ExpenseSplit } from './expense-split.entity';

@Entity({ name: 'expenses' })
export class Expense {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  groupId!: string;

  @Column()
  description!: string;

  @Column({ type: 'decimal', precision: 14, scale: 2 })
  amount!: string;

  @Column({
    type: 'enum',
    enum: Currency,
  })
  currency!: Currency;

  @Column({
    type: 'enum',
    enum: SplitType,
  })
  splitType!: SplitType;

  @Column({ type: 'timestamp' })
  date!: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @ManyToOne(() => Group, (group: Group) => group.expenses, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'groupId' })
  group!: Group;

  @OneToMany(() => ExpensePayer, (payer: ExpensePayer) => payer.expense, {
    cascade: true,
  })
  payers!: ExpensePayer[];

  @OneToMany(() => ExpenseSplit, (split: ExpenseSplit) => split.expense, {
    cascade: true,
  })
  splits!: ExpenseSplit[];
}
