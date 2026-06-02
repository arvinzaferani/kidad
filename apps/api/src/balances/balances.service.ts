import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  ExpenseWithPayersAndSplits,
  BalanceMap,
} from '../domain/settlement/settlement.types';
import { SettlementEngine } from '../domain/settlement/settlement.service';
import { Expense, ExpensePayer, ExpenseSplit } from '../database/entities';
import { Repository } from 'typeorm';

@Injectable()
export class BalancesService {
  constructor(
    @InjectRepository(Expense)
    private readonly expensesRepository: Repository<Expense>,
  ) {}

  /**
   * In a real implementation this would load group expenses from the DB
   * and then delegate to the pure SettlementEngine.
   */
  getGroupBalances(expenses: ExpenseWithPayersAndSplits[]): BalanceMap {
    return SettlementEngine.calculateBalances(expenses);
  }

  async getGroupBalancesFromDb(groupId: string): Promise<BalanceMap> {
    const expenses = await this.expensesRepository.find({
      where: { groupId },
      relations: { payers: true, splits: true },
    });

    return this.getGroupBalances(
      expenses.map((expense: Expense) => ({
        id: expense.id,
        groupId: expense.groupId,
        payers: expense.payers.map((payer: ExpensePayer) => ({
          userId: payer.groupMemberId,
          amount: Number(payer.amount),
        })),
        splits: expense.splits.map((split: ExpenseSplit) => ({
          userId: split.groupMemberId,
          value: Number(split.value),
        })),
      })),
    );
  }

  async getGlobalBalancesFromDb(): Promise<BalanceMap> {
    const expenses = await this.expensesRepository.find({
      relations: { payers: true, splits: true },
    });

    return this.getGroupBalances(
      expenses.map((expense: Expense) => ({
        id: expense.id,
        groupId: expense.groupId,
        payers: expense.payers.map((payer: ExpensePayer) => ({
          userId: payer.groupMemberId,
          amount: Number(payer.amount),
        })),
        splits: expense.splits.map((split: ExpenseSplit) => ({
          userId: split.groupMemberId,
          value: Number(split.value),
        })),
      })),
    );
  }
}
