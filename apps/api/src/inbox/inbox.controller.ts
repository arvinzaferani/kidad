import { Controller, Get, Query } from '@nestjs/common';
import { InboxService } from './inbox.service';
import { InboxQueryDto } from './dto/inbox-query.dto';

@Controller('inbox')
export class InboxController {
  constructor(private readonly inboxService: InboxService) {}

  @Get()
  find(@Query() query: InboxQueryDto) {
    if (!query.userId) {
      return {
        items: [],
        total: 0,
        page: query.page ?? 1,
        limit: query.limit ?? 10,
        hasNext: false,
      };
    }

    return this.inboxService.findByUser(
      query.userId,
      query.page ?? 1,
      query.limit ?? 10,
    );
  }
}
