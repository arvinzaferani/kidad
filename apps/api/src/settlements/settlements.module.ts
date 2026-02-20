import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SettlementsController } from './settlements.controller';
import { SettlementsService } from './settlements.service';
import {
  Expense,
  Group,
  GroupMember,
  InboxMessage,
  Settlement,
  User,
} from '../database/entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Expense,
      Settlement,
      InboxMessage,
      GroupMember,
      User,
      Group,
    ]),
  ],
  controllers: [SettlementsController],
  providers: [SettlementsService],
})
export class SettlementsModule {}
