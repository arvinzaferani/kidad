import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Group } from './group.entity';
import { User } from './user.entity';
import { GroupMember } from './group-member.entity';
import { SettlementMethod, SettlementStatus } from './enums';

@Entity({ name: 'settlements' })
export class Settlement {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  groupId!: string;

  @Column({ nullable: true })
  payerId?: string;

  @Column({ nullable: true })
  receiverId?: string;

  @Column()
  payerMemberId!: string;

  @Column()
  receiverMemberId!: string;

  @Column({ type: 'decimal', precision: 14, scale: 2 })
  amount!: string;

  @Column({
    type: 'enum',
    enum: SettlementMethod,
  })
  method!: SettlementMethod;

  @Column({
    type: 'enum',
    enum: SettlementStatus,
    default: SettlementStatus.PENDING,
  })
  status!: SettlementStatus;

  @CreateDateColumn()
  createdAt!: Date;

  @ManyToOne(() => Group, (group: Group) => group.settlements, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'groupId' })
  group!: Group;

  @ManyToOne(() => User, (user: User) => user.settlementsOut, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'payerId' })
  payer?: User;

  @ManyToOne(() => User, (user: User) => user.settlementsIn, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'receiverId' })
  receiver?: User;

  @ManyToOne(() => GroupMember, (groupMember: GroupMember) => groupMember.outgoingSettlements, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'payerMemberId' })
  payerMember!: GroupMember;

  @ManyToOne(() => GroupMember, (groupMember: GroupMember) => groupMember.incomingSettlements, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'receiverMemberId' })
  receiverMember!: GroupMember;
}
