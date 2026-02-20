export type UserId = string;

export interface ExpensePayer {
  userId: UserId;
  amount: number;
}

export interface ExpenseSplit {
  userId: UserId;
  value: number;
}

export interface ExpenseWithPayersAndSplits {
  id: string;
  groupId: string;
  payers: ExpensePayer[];
  splits: ExpenseSplit[];
}

export type BalanceMap = Record<UserId, number>;

export interface SettlementSuggestion {
  from: UserId;
  to: UserId;
  amount: number;
}

