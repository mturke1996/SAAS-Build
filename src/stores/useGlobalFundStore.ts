import { create } from 'zustand';
import { globalFundTransactionsService } from '../services/firebaseService';
import type { GlobalFundTransaction } from '../types';
import { orderBy } from 'firebase/firestore';
import toast from 'react-hot-toast';

interface GlobalFundState {
  transactions: GlobalFundTransaction[];
  isLoading: boolean;

  // Computed getters
  getTotalDeposits: () => number;
  getTotalWithdrawals: () => number;
  getCurrentBalance: () => number;
  getUserBalance: (userId: string) => number;
  getUserStats: (userId: string) => { deposited: number; withdrawn: number; remaining: number };

  // Actions
  initialize: () => () => void;
  addTransaction: (tx: GlobalFundTransaction) => Promise<void>;
  updateTransaction: (id: string, data: Partial<GlobalFundTransaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
}

export const useGlobalFundStore = create<GlobalFundState>((set, get) => ({
  transactions: [],
  isLoading: true,

  // ─── Computed ─────────────────────────────────
  getTotalDeposits: () =>
    get().transactions.filter(t => t.type === 'deposit').reduce((s, t) => s + t.amount, 0),

  getTotalWithdrawals: () =>
    get().transactions.filter(t => t.type === 'withdrawal').reduce((s, t) => s + t.amount, 0),

  getCurrentBalance: () => {
    const { transactions } = get();
    return transactions.reduce((sum, t) => {
      return t.type === 'deposit' ? sum + t.amount : sum - t.amount;
    }, 0);
  },

  getUserBalance: (userId: string) => {
    const { transactions } = get();
    return transactions
      .filter(t => t.userId === userId)
      .reduce((sum, t) => (t.type === 'deposit' ? sum + t.amount : sum - t.amount), 0);
  },

  getUserStats: (userId: string) => {
    const { transactions } = get();
    const userTxs = transactions.filter(t => t.userId === userId);
    const deposited = userTxs.filter(t => t.type === 'deposit').reduce((s, t) => s + t.amount, 0);
    const withdrawn = userTxs.filter(t => t.type === 'withdrawal').reduce((s, t) => s + t.amount, 0);
    return { deposited, withdrawn, remaining: deposited - withdrawn };
  },

  // ─── Initialize ────────────────────────────────
  initialize: () => {
    set({ isLoading: true });
    const unsub = globalFundTransactionsService.subscribe(
      (data) => set({ transactions: data, isLoading: false }),
      [orderBy('createdAt', 'desc')]
    );
    return unsub;
  },

  // ─── Actions ───────────────────────────────────
  addTransaction: async (tx) => {
    try {
      await globalFundTransactionsService.add(tx);
      toast.success(tx.type === 'deposit' ? 'تم إيداع الرصيد بنجاح' : 'تم تسجيل السحب بنجاح');
    } catch (e) {
      toast.error('حدث خطأ أثناء تنفيذ العملية');
      throw e;
    }
  },

  updateTransaction: async (id, data) => {
    try {
      await globalFundTransactionsService.update(id, data);
      toast.success('تم التحديث بنجاح');
    } catch (e) {
      toast.error('حدث خطأ');
      throw e;
    }
  },

  deleteTransaction: async (id) => {
    try {
      await globalFundTransactionsService.delete(id);
      toast.success('تم الحذف');
    } catch (e) {
      toast.error('حدث خطأ');
      throw e;
    }
  },
}));
