import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { SplitSession } from './split-session.entity';
import { User } from './user.entity';

@Entity({ name: 'split_members' })
@Unique(['sessionId', 'userId'])
export class SplitMember {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  sessionId!: string;

  @Column()
  userId!: string;

  @CreateDateColumn()
  joinedAt!: Date;

  @ManyToOne(() => SplitSession, (session) => session.members, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'sessionId' })
  session!: SplitSession;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;
}