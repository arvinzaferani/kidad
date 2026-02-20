import {
  BalanceMap,
  ExpenseWithPayersAndSplits,
  SettlementSuggestion,
} from './settlement.types';

/**
 * Pure calculation utilities for balances and settlement suggestions.
 * No database access here – this can be unit-tested in isolation.
 */
export class SettlementEngine {
  static calculateBalances(
    expenses: ExpenseWithPayersAndSplits[],
  ): BalanceMap {
    const balance: BalanceMap = {};

    for (const expense of expenses) {
      for (const payer of expense.payers) {
        balance[payer.userId] =
          (balance[payer.userId] ?? 0) + payer.amount;
      }

      for (const split of expense.splits) {
        balance[split.userId] =
          (balance[split.userId] ?? 0) - split.value;
      }
    }

    return balance;
  }

  static splitDebtorsCreditors(balance: BalanceMap) {
    const debtors: [string, number][] = [];
    const creditors: [string, number][] = [];

    for (const [userId, amount] of Object.entries(balance)) {
      if (amount < 0) debtors.push([userId, -amount]);
      if (amount > 0) creditors.push([userId, amount]);
    }

    return { debtors, creditors };
  }

  /**
   * Greedy O(n) algorithm that produces a minimal set
   * of settlement transactions between debtors and creditors.
   */
  static generateSettlements(
    debtors: [string, number][],
    creditors: [string, number][],
  ): SettlementSuggestion[] {
    const result: SettlementSuggestion[] = [];

    let i = 0;
    let j = 0;

    while (i < debtors.length && j < creditors.length) {
      const [debtorId, debt] = debtors[i];
      const [creditorId, credit] = creditors[j];

      const amount = Math.min(debt, credit);

      result.push({
        from: debtorId,
        to: creditorId,
        amount,
      });

      debtors[i][1] -= amount;
      creditors[j][1] -= amount;

      if (debtors[i][1] === 0) i++;
      if (creditors[j][1] === 0) j++;
    }

    return result;
  }
}

