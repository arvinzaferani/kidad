import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { User } from './user.entity';
import { Group } from './group.entity';
import { ExpensePayer } from './expense-payer.entity';
import { ExpenseSplit } from './expense-split.entity';
import { Settlement } from './settlement.entity';

@Entity({ name: 'group_members' })
@Unique(['userId', 'groupId'])
export class GroupMember {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ nullable: true })
  userId?: string;

  @Column()
  groupId!: string;

  @Column({ default: false })
  isAdmin!: boolean;

  @Column({ nullable: true })
  guestName?: string;

  @Column({ nullable: true })
  guestEmail?: string;

  @Column({ nullable: true })
  guestPhone?: string;

  @ManyToOne(() => User, (user: User) => user.memberships, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'userId' })
  user?: User;

  @ManyToOne(() => Group, (group: Group) => group.members, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'groupId' })
  group!: Group;

  @OneToMany(() => ExpensePayer, (payer: ExpensePayer) => payer.groupMember)
  payerEntries!: ExpensePayer[];

  @OneToMany(() => ExpenseSplit, (split: ExpenseSplit) => split.groupMember)
  splitEntries!: ExpenseSplit[];

  @OneToMany(() => Settlement, (settlement: Settlement) => settlement.payerMember)
  outgoingSettlements!: Settlement[];

  @OneToMany(() => Settlement, (settlement: Settlement) => settlement.receiverMember)
  incomingSettlements!: Settlement[];
}
