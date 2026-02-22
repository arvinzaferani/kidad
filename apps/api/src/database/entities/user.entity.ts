import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { GroupMember } from './group-member.entity';
import { ExpensePayer } from './expense-payer.entity';
import { ExpenseSplit } from './expense-split.entity';
import { Settlement } from './settlement.entity';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true, nullable: true })
  phone?: string;

  @Column({ unique: true, nullable: true })
  email?: string;

  @Column({ default: true })
  isEmailVerified!: boolean;

  @Column()
  passwordHash!: string;

  @Column()
  nickname!: string;

  @Column({ nullable: true })
  avatarUrl?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @OneToMany(() => GroupMember, (membership: GroupMember) => membership.user)
  memberships!: GroupMember[];

  @OneToMany(() => ExpensePayer, (expensePayer: ExpensePayer) => expensePayer.user)
  expensesPaid!: ExpensePayer[];

  @OneToMany(() => ExpenseSplit, (expenseSplit: ExpenseSplit) => expenseSplit.user)
  splits!: ExpenseSplit[];

  @OneToMany(() => Settlement, (settlement: Settlement) => settlement.payer)
  settlementsOut!: Settlement[];

  @OneToMany(() => Settlement, (settlement: Settlement) => settlement.receiver)
  settlementsIn!: Settlement[];
}
