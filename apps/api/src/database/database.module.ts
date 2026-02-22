import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  EmailVerificationToken,
  Expense,
  ExpensePayer,
  ExpenseSplit,
  FriendRequest,
  Group,
  GroupInvitation,
  GroupMember,
  InboxMessage,
  Settlement,
  User,
} from './entities';

const isTruthy = (value?: string) =>
  value === '1' || value === 'true';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      connectTimeoutMS: Number(process.env.DB_CONNECT_TIMEOUT_MS ?? 5000),
      extra: {
        connectionTimeoutMillis: Number(
          process.env.DB_CONNECT_TIMEOUT_MS ?? 5000,
        ),
      },
      entities: [
        User,
        EmailVerificationToken,
        Group,
        GroupMember,
        Expense,
        ExpensePayer,
        ExpenseSplit,
        Settlement,
        GroupInvitation,
        InboxMessage,
        FriendRequest,
      ],
      synchronize: isTruthy(process.env.DB_SYNCHRONIZE),
      logging: isTruthy(process.env.DB_LOGGING),
    }),
  ],
})
export class DatabaseModule {}
