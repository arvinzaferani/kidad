import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Currency, GroupMemberMode } from './enums';
import { GroupMember } from './group-member.entity';
import { Expense } from './expense.entity';
import { Settlement } from './settlement.entity';

@Entity({ name: 'groups' })
export class Group {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column({
    type: 'enum',
    enum: Currency,
    default: Currency.TOMAN,
  })
  currency!: Currency;

  @Column({ nullable: true })
  description?: string;

  @Column({ nullable: true })
  imageUrl?: string;

  @Column({
    type: 'enum',
    enum: GroupMemberMode,
    default: GroupMemberMode.STANDARD,
  })
  memberMode!: GroupMemberMode;

  @CreateDateColumn()
  createdAt!: Date;

  @OneToMany(() => GroupMember, (member: GroupMember) => member.group)
  members!: GroupMember[];

  @OneToMany(() => Expense, (expense: Expense) => expense.group)
  expenses!: Expense[];

  @OneToMany(() => Settlement, (settlement: Settlement) => settlement.group)
  settlements!: Settlement[];
}
