import { Expense, Debt, AppData } from '../types';

const STORAGE_KEY = 'fintrack_pro_data';

const getInitialData = (): AppData => ({
  expenses: [],
  debts: []
});

export const loadData = (): AppData => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : getInitialData();
  } catch (error) {
    console.error('Failed to load data', error);
    return getInitialData();
  }
};

export const saveData = (data: AppData): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save data', error);
  }
};
