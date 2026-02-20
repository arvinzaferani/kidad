import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InboxController } from './inbox.controller';
import { InboxService } from './inbox.service';
import { FriendRequest, GroupInvitation, InboxMessage } from '../database/entities';

@Module({
  imports: [TypeOrmModule.forFeature([InboxMessage, GroupInvitation, FriendRequest])],
  controllers: [InboxController],
  providers: [InboxService],
})
export class InboxModule {}
