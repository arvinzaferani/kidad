import { Logger } from '@nestjs/common';
import { DataSource, EntitySubscriberInterface, EventSubscriber, InsertEvent } from 'typeorm';
import { InboxMessage, User } from '../database/entities';
import { AuthMailerService } from '../auth/auth-mailer.service';

@EventSubscriber()
export class InboxEmailSubscriber implements EntitySubscriberInterface<InboxMessage> {
  private readonly logger = new Logger(InboxEmailSubscriber.name);

  constructor(
    dataSource: DataSource,
    private readonly authMailerService: AuthMailerService,
  ) {
    dataSource.subscribers.push(this);
  }

  listenTo() {
    return InboxMessage;
  }

  async afterInsert(event: InsertEvent<InboxMessage>) {
    const message = event.entity;
    if (!message?.userId) return;

    const user = await event.manager.findOne(User, {
      where: { id: message.userId },
      select: {
        id: true,
        email: true,
        nickname: true,
      },
    });

    if (!user?.email) return;

    try {
      await this.authMailerService.sendInboxNotificationEmail({
        to: user.email,
        nickname: user.nickname,
        message: message.message,
      });
    } catch (error) {
      this.logger.error(`Failed to send inbox notification email for user ${user.id}: ${(error as Error).message}`);
    }
  }
}
