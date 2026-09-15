import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
} from '@nestjs/common';
import { SplitService } from './split.service';
import { CreateSplitSessionDto } from './dto/create-split-session.dto';
import { CreateSplitExpenseDto } from './dto/create-split-expense.dto';
import { parseRequestUserId } from './split-auth';

@Controller('split')
export class SplitController {
  constructor(private readonly splitService: SplitService) {}

  @Get('invite/:inviteToken')
  inviteInfo(@Param('inviteToken') inviteToken: string) {
    return this.splitService.inviteInfo(inviteToken);
  }

  @Post('sessions')
  create(
    @Headers('authorization') authorization: string | undefined,
    @Body() body: CreateSplitSessionDto,
  ) {
    return this.splitService.create(parseRequestUserId(authorization), body);
  }

  @Post('join/:inviteToken')
  join(
    @Param('inviteToken') inviteToken: string,
    @Headers('authorization') authorization: string | undefined,
  ) {
    return this.splitService.join(inviteToken, parseRequestUserId(authorization));
  }

  @Get('sessions/:sessionId')
  findOne(
    @Param('sessionId') sessionId: string,
    @Headers('authorization') authorization: string | undefined,
  ) {
    return this.splitService.findOne(sessionId, parseRequestUserId(authorization));
  }

  @Post('sessions/:sessionId/close')
  close(
    @Param('sessionId') sessionId: string,
    @Headers('authorization') authorization: string | undefined,
  ) {
    return this.splitService.close(sessionId, parseRequestUserId(authorization));
  }

  @Post('sessions/:sessionId/expenses')
  addExpense(
    @Param('sessionId') sessionId: string,
    @Headers('authorization') authorization: string | undefined,
    @Body() body: CreateSplitExpenseDto,
  ) {
    return this.splitService.addExpense(
      sessionId,
      parseRequestUserId(authorization),
      body,
    );
  }
}