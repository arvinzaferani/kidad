import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GroupsController } from './groups.controller';
import { GroupsService } from './groups.service';
import {
  Expense,
  FriendRequest,
  Group,
  GroupInvitation,
  GroupMember,
  InboxMessage,
  Settlement,
  User,
} from '../database/entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Group,
      GroupMember,
      GroupInvitation,
      InboxMessage,
      User,
      Expense,
      Settlement,
      FriendRequest,
    ]),
  ],
  controllers: [GroupsController],
  providers: [GroupsService],
})
export class GroupsModule {}
