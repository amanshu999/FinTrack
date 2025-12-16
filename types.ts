export enum TransactionType {
  EXPENSE = 'EXPENSE',
  INCOME = 'INCOME',
}

export enum DebtType {
  I_OWE = 'I_OWE',
  OWES_ME = 'OWES_ME',
}

export enum DebtStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
}

export interface Expense {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: string;
  type: TransactionType;
}

export interface Debt {
  id: string;
  person: string;
  amount: number;
  type: DebtType;
  status: DebtStatus;
  dueDate?: string;
  description?: string;
}

export interface AppData {
  expenses: Expense[];
  debts: Debt[];
}

export type ViewState = 'DASHBOARD' | 'EXPENSES' | 'DEBTS' | 'SETTINGS';
