import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { GroupMember } from './group-member.entity';
import { UserStatus } from './enums';
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

  @Column({ default: false })
  isAdmin!: boolean;

  @Column({ default: false })
  isBanned!: boolean;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.ACTIVE,
  })
  status!: UserStatus;

  @Column({ nullable: true })
  passwordHash?: string;

  @Column()
  nickname!: string;

  @Column({ nullable: true })
  avatarUrl?: string;

  @Column({ name: 'card_number', type: 'varchar', length: 16, nullable: true })
  cardNumber?: string;

  @Column({ name: 'shaba', type: 'varchar', length: 26, nullable: true })
  shaba?: string;

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
