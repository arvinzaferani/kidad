import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { User } from './user.entity';
import { FriendRequestStatus } from './enums';

@Entity({ name: 'friend_requests' })
@Unique(['requesterId', 'addresseeId'])
export class FriendRequest {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  requesterId!: string;

  @Column()
  addresseeId!: string;

  @Column({
    type: 'enum',
    enum: FriendRequestStatus,
    default: FriendRequestStatus.PENDING,
  })
  status!: FriendRequestStatus;

  @CreateDateColumn()
  createdAt!: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'requesterId' })
  requester!: User;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'addresseeId' })
  addressee!: User;
}
