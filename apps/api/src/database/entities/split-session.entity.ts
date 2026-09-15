import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { SplitSessionStatus } from './enums';
import { User } from './user.entity';
import { SplitMember } from './split-member.entity';
import { SplitExpense } from './split-expense.entity';

@Entity({ name: 'split_sessions' })
export class SplitSession {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  hostId!: string;

  @Column({ unique: true })
  inviteToken!: string;

  @Column({
    type: 'enum',
    enum: SplitSessionStatus,
    default: SplitSessionStatus.ACTIVE,
  })
  status!: SplitSessionStatus;

  @Column({ type: 'varchar', nullable: true })
  title?: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'hostId' })
  host!: User;

  @OneToMany(() => SplitMember, (member) => member.session, { cascade: true })
  members!: SplitMember[];

  @OneToMany(() => SplitExpense, (expense) => expense.session, {
    cascade: true,
  })
  expenses!: SplitExpense[];
}