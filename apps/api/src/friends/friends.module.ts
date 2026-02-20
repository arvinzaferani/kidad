import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FriendsController } from './friends.controller';
import { FriendsService } from './friends.service';
import { FriendRequest, InboxMessage, User } from '../database/entities';

@Module({
  imports: [TypeOrmModule.forFeature([FriendRequest, User, InboxMessage])],
  controllers: [FriendsController],
  providers: [FriendsService],
  exports: [FriendsService],
})
export class FriendsModule {}
