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
import { InboxMessageType } from './enums';

@Entity({ name: 'inbox_messages' })
export class InboxMessage {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  userId!: string;

  @Column({ nullable: true })
  groupId?: string;

  @Column({
    type: 'enum',
    enum: InboxMessageType,
  })
  type!: InboxMessageType;

  @Column()
  message!: string;

  @Column({ type: 'jsonb', nullable: true })
  meta?: Record<string, string>;

  @CreateDateColumn()
  createdAt!: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @ManyToOne(() => Group, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'groupId' })
  group?: Group;
}
