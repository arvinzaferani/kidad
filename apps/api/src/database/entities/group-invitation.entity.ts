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
import { InvitationStatus } from './enums';

@Entity({ name: 'group_invitations' })
export class GroupInvitation {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  groupId!: string;

  @Column()
  inviterId!: string;

  @Column()
  inviteeId!: string;

  @Column({
    type: 'enum',
    enum: InvitationStatus,
    default: InvitationStatus.PENDING,
  })
  status!: InvitationStatus;

  @CreateDateColumn()
  createdAt!: Date;

  @ManyToOne(() => Group, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'groupId' })
  group!: Group;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'inviterId' })
  inviter!: User;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'inviteeId' })
  invitee!: User;
}
