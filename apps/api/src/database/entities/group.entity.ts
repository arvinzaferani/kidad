import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Currency } from './enums';
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

  @CreateDateColumn()
  createdAt!: Date;

  @OneToMany(() => GroupMember, (member: GroupMember) => member.group)
  members!: GroupMember[];

  @OneToMany(() => Expense, (expense: Expense) => expense.group)
  expenses!: Expense[];

  @OneToMany(() => Settlement, (settlement: Settlement) => settlement.group)
  settlements!: Settlement[];
}
