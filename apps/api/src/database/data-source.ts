import '../config/load-env';
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import {
  EmailLoginToken,
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
  PasswordResetToken,
} from './entities';

const isTruthy = (value?: string) =>
  value === '1' || value === 'true';

if (!process.env.DATABASE_URL) {
  throw new Error(
    'DATABASE_URL is not set. Check apps/api/.env.local and env loading.',
  );
}

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  connectTimeoutMS: Number(process.env.DB_CONNECT_TIMEOUT_MS ?? 5000),
  extra: {
    connectionTimeoutMillis: Number(process.env.DB_CONNECT_TIMEOUT_MS ?? 5000),
  },
  entities: [
    User,
    EmailVerificationToken,
    PasswordResetToken,
    EmailLoginToken,
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
  migrations: ['src/database/migrations/*.ts'],
  synchronize: isTruthy(process.env.DB_SYNCHRONIZE),
  logging: isTruthy(process.env.DB_LOGGING),
});
