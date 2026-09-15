import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SplitController } from './split.controller';
import { SplitService } from './split.service';
import {
  SplitExpense,
  SplitExpenseParticipant,
  SplitExpensePayer,
  SplitMember,
  SplitSession,
  User,
} from '../database/entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SplitSession,
      SplitMember,
      SplitExpense,
      SplitExpenseParticipant,
      SplitExpensePayer,
      User,
    ]),
  ],
  controllers: [SplitController],
  providers: [SplitService],
})
export class SplitModule {}