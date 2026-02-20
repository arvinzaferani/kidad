import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExpensesController } from './expenses.controller';
import { ExpensesService } from './expenses.service';
import {
  Expense,
  ExpensePayer,
  ExpenseSplit,
  GroupMember,
} from '../database/entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([Expense, ExpensePayer, ExpenseSplit, GroupMember]),
  ],
  controllers: [ExpensesController],
  providers: [ExpensesService],
})
export class ExpensesModule {}
