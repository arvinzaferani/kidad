import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InboxController } from './inbox.controller';
import { InboxService } from './inbox.service';
import { FriendRequest, GroupInvitation, InboxMessage } from '../database/entities';
import { InboxEmailSubscriber } from './inbox-email.subscriber';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([InboxMessage, GroupInvitation, FriendRequest]),
    AuthModule,
  ],
  controllers: [InboxController],
  providers: [InboxService, InboxEmailSubscriber],
})
export class InboxModule {}
