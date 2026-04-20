import { create } from 'zustand';
import {
  clientsService,
  invoicesService,
  paymentsService,
  expensesService,
  standaloneDebtsService,
  debtPartiesService,
  expenseInvoicesService,
  workersService,
  userBalancesService,
  lettersService,
} from '../services/firebaseService';
import type {
  Client,
  Invoice,
  Payment,
  Expense,
  StandaloneDebt,
  DebtParty,
  ExpenseInvoice,
  Worker,
  UserBalance,
  Letter,
} from '../types';
import { orderBy, where } from 'firebase/firestore';
import toast from 'react-hot-toast';

// ─── localStorage Cache helpers ──────────────────────────────
const CACHE_PREFIX = 'app-cache-';
const CACHE_KEYS = ['clients', 'invoices', 'payments', 'expenses', 'expenseInvoices', 'standaloneDebts', 'debtParties', 'workers', 'userBalances', 'letters'] as const;

const loadCache = (key: string): any[] => {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
};

// Debounced save to avoid excessive writes
const saveCacheTimers: Record<string, any> = {};
const saveCache = (key: string, data: any[]) => {
  clearTimeout(saveCacheTimers[key]);
  saveCacheTimers[key] = setTimeout(() => {
    try { localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(data)); } catch {}
  }, 500);
};

// Helper to handle async operations with toast notifications
const handleAsync = async (operation: () => Promise<any>, successMessage: string) => {
  try {
    await operation();
    toast.success(successMessage);
  } catch (error) {
    console.error(error);
    toast.error('حدث خطأ أثناء تنفيذ العملية');
    throw error;
  }
};

interface DataState {
  clients: Client[];
  invoices: Invoice[];
  payments: Payment[];
  expenses: Expense[];
  expenseInvoices: ExpenseInvoice[];
  standaloneDebts: StandaloneDebt[];
  debtParties: DebtParty[];
  workers: Worker[];
  userBalances: UserBalance[];
  letters: Letter[];
  isLoading: boolean;
  
  // Initialization
  initialize: () => () => void; // Returns unsubscribe function

  // Actions
  addClient: (client: Client) => Promise<void>;
  updateClient: (id: string, data: Partial<Client>) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;

  addInvoice: (invoice: Invoice) => Promise<void>;
  updateInvoice: (id: string, data: Partial<Invoice>) => Promise<void>;
  deleteInvoice: (id: string) => Promise<void>;

  addPayment: (payment: Payment) => Promise<void>;
  updatePayment: (id: string, data: Partial<Payment>) => Promise<void>;
  deletePayment: (id: string) => Promise<void>;
  
  addExpense: (expense: Expense) => Promise<void>;
  updateExpense: (id: string, data: Partial<Expense>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  
  addExpenseInvoice: (invoice: ExpenseInvoice) => Promise<void>;
  updateExpenseInvoice: (id: string, data: Partial<ExpenseInvoice>) => Promise<void>;
  deleteExpenseInvoice: (id: string) => Promise<void>;

  addStandaloneDebt: (debt: StandaloneDebt) => Promise<void>;
  updateStandaloneDebt: (id: string, data: Partial<StandaloneDebt>) => Promise<void>;
  deleteStandaloneDebt: (id: string) => Promise<void>;

  addDebtParty: (party: DebtParty) => Promise<void>;
  updateDebtParty: (id: string, data: Partial<DebtParty>) => Promise<void>;
  deleteDebtParty: (id: string) => Promise<void>;

  addWorker: (worker: Worker) => Promise<void>;
  updateWorker: (id: string, data: Partial<Worker>) => Promise<void>;
  deleteWorker: (id: string) => Promise<void>;

  addUserBalance: (balance: UserBalance) => Promise<void>;
  updateUserBalance: (id: string, data: Partial<UserBalance>) => Promise<void>;
  deleteUserBalance: (id: string) => Promise<void>;

  addLetter: (letter: Letter) => Promise<void>;
  updateLetter: (id: string, data: Partial<Letter>) => Promise<void>;
  deleteLetter: (id: string) => Promise<void>;
}

export const useDataStore = create<DataState>((set, get) => ({
  // ─── Load cached data instantly on store creation ──────────
  clients: loadCache('clients'),
  invoices: loadCache('invoices'),
  payments: loadCache('payments'),
  expenses: loadCache('expenses'),
  expenseInvoices: loadCache('expenseInvoices'),
  standaloneDebts: loadCache('standaloneDebts'),
  debtParties: loadCache('debtParties'),
  workers: loadCache('workers'),
  userBalances: loadCache('userBalances'),
  letters: loadCache('letters'),
  isLoading: true,

  initialize: () => {
    // If we have cached data, immediately mark as "not loading" so UI renders fast
    const hasCachedData = CACHE_KEYS.some(k => loadCache(k).length > 0);
    if (hasCachedData) {
      set({ isLoading: false });
    }
    
    // Track when all collections have received first data
    let loadedCount = 0;
    const totalCollections = 10;
    const markLoaded = () => {
      loadedCount++;
      if (loadedCount >= totalCollections) {
        set({ isLoading: false });
      }
    };

    // Subscribe to collections — update state AND cache
    const unsubClients = clientsService.subscribe((data) => { set({ clients: data }); saveCache('clients', data); markLoaded(); }, [orderBy('createdAt', 'desc')]);
    const unsubInvoices = invoicesService.subscribe((data) => { set({ invoices: data }); saveCache('invoices', data); markLoaded(); }, [orderBy('createdAt', 'desc')]);
    const unsubPayments = paymentsService.subscribe((data) => { set({ payments: data }); saveCache('payments', data); markLoaded(); }, [orderBy('createdAt', 'desc')]);
    const unsubExpenses = expensesService.subscribe((data) => { set({ expenses: data }); saveCache('expenses', data); markLoaded(); }, [orderBy('date', 'desc')]);
    const unsubExpenseInvoices = expenseInvoicesService.subscribe((data) => { set({ expenseInvoices: data }); saveCache('expenseInvoices', data); markLoaded(); }, [orderBy('createdAt', 'desc')]);
    const unsubDebts = standaloneDebtsService.subscribe((data) => { set({ standaloneDebts: data }); saveCache('standaloneDebts', data); markLoaded(); }, [orderBy('date', 'desc')]);
    const unsubParties = debtPartiesService.subscribe((data) => { set({ debtParties: data }); saveCache('debtParties', data); markLoaded(); }, [orderBy('name', 'asc')]);
    const unsubWorkers = workersService.subscribe((data) => { set({ workers: data }); saveCache('workers', data); markLoaded(); }, [orderBy('createdAt', 'desc')]);
    const unsubUserBalances = userBalancesService.subscribe((data) => { set({ userBalances: data }); saveCache('userBalances', data); markLoaded(); }, [orderBy('date', 'desc')]);
    const unsubLetters = lettersService.subscribe((data) => { set({ letters: data }); saveCache('letters', data); markLoaded(); }, [orderBy('createdAt', 'desc')]);

    // Timeout fallback: if data doesn't load in 8s, stop showing loading
    const timeout = setTimeout(() => {
      if (loadedCount < totalCollections) {
        set({ isLoading: false });
      }
    }, 8000);

    return () => {
      clearTimeout(timeout);
      unsubClients();
      unsubInvoices();
      unsubPayments();
      unsubExpenses();
      unsubExpenseInvoices();
      unsubDebts();
      unsubParties();
      unsubWorkers();
      unsubUserBalances();
      unsubLetters();
    };
  },

  // Client Actions
  addClient: async (client) => {
    await handleAsync(() => clientsService.add(client), 'تم إضافة العميل بنجاح');
  },
  updateClient: async (id, data) => {
    await handleAsync(() => clientsService.update(id, data), 'تم تحديث بيانات العميل');
  },
  deleteClient: async (id) => {
    await handleAsync(async () => {
      const state = get();
      
      // Collect all related IDs
      const relatedExpenses = state.expenses.filter(i => i.clientId === id);
      const relatedPayments = state.payments.filter(i => i.clientId === id);
      const relatedInvoices = state.invoices.filter(i => i.clientId === id);
      const relatedDebts = state.standaloneDebts.filter(i => i.clientId === id);
      const relatedWorkers = state.workers.filter(i => i.clientId === id);
      const relatedBalances = state.userBalances.filter(i => i.clientId === id);

      // Parallel delete for speed
      await Promise.all([
        ...relatedExpenses.map(item => expensesService.delete(item.id)),
        ...relatedPayments.map(item => paymentsService.delete(item.id)),
        ...relatedInvoices.map(item => invoicesService.delete(item.id)),
        ...relatedDebts.map(item => standaloneDebtsService.delete(item.id)),
        ...relatedWorkers.map(item => workersService.delete(item.id)),
        ...relatedBalances.map(item => userBalancesService.delete(item.id)),
      ]);

      // Delete client last
      await clientsService.delete(id);
    }, 'تم حذف العميل وجميع بياناته (فواتير، مصاريف، عمال) بنجاح');
  },

  // Invoice Actions
  addInvoice: async (invoice) => {
    await handleAsync(() => invoicesService.add(invoice), 'تم إنشاء الفاتورة بنجاح');
  },
  updateInvoice: async (id, data) => {
    await handleAsync(() => invoicesService.update(id, data), 'تم تحديث الفاتورة');
  },
  deleteInvoice: async (id) => {
    await handleAsync(() => invoicesService.delete(id), 'تم حذف الفاتورة');
  },

  // Payment Actions
  addPayment: async (payment) => {
    await handleAsync(async () => {
      await paymentsService.add(payment);
      // Update invoice status if fully paid? This logic is handled in UI usually or could be here
    }, 'تم تسجيل الدفعة بنجاح');
  },
  updatePayment: async (id, data) => {
    await handleAsync(() => paymentsService.update(id, data), 'تم تحديث الدفعة');
  },
  deletePayment: async (id) => {
    await handleAsync(() => paymentsService.delete(id), 'تم حذف الدفعة');
  },

  // Expense Actions
  addExpense: async (expense) => {
    await handleAsync(() => expensesService.add(expense), 'تم تسجيل المصروف بنجاح');
  },
  updateExpense: async (id, data) => {
    await handleAsync(() => expensesService.update(id, data), 'تم تحديث المصروف');
  },
  deleteExpense: async (id) => {
    await handleAsync(() => expensesService.delete(id), 'تم حذف المصروف');
  },

  // Expense Invoice Actions
  addExpenseInvoice: async (invoice) => {
    await handleAsync(() => expenseInvoicesService.add(invoice), 'تم إنشاء فاتورة المصروفات');
  },
  updateExpenseInvoice: async (id, data) => {
    await handleAsync(() => expenseInvoicesService.update(id, data), 'تم تحديث فاتورة المصروفات');
  },
  deleteExpenseInvoice: async (id) => {
    await handleAsync(() => expenseInvoicesService.delete(id), 'تم حذف فاتورة المصروفات');
  },

  // Standalone Debt Actions
  addStandaloneDebt: async (debt) => {
    await handleAsync(() => standaloneDebtsService.add(debt), 'تم تسجيل الدين بنجاح');
  },
  updateStandaloneDebt: async (id, data) => {
    await handleAsync(() => standaloneDebtsService.update(id, data), 'تم تحديث الدين');
  },
  deleteStandaloneDebt: async (id) => {
    await handleAsync(() => standaloneDebtsService.delete(id), 'تم حذف الدين');
  },

  // Debt Party Actions
  addDebtParty: async (party) => {
    await handleAsync(() => debtPartiesService.add(party), 'تم إضافة الطرف بنجاح');
  },
  updateDebtParty: async (id, data) => {
    await handleAsync(() => debtPartiesService.update(id, data), 'تم تحديث بيانات الطرف');
  },
  deleteDebtParty: async (id) => {
    await handleAsync(() => debtPartiesService.delete(id), 'تم حذف الطرف');
  },

  // Worker Actions
  addWorker: async (worker) => {
    await handleAsync(() => workersService.add(worker), 'تم إضافة العامل بنجاح');
  },
  updateWorker: async (id, data) => {
    await handleAsync(() => workersService.update(id, data), 'تم تحديث بيانات العامل');
  },
  deleteWorker: async (id) => {
    await handleAsync(() => workersService.delete(id), 'تم حذف العامل');
  },

  // User Balance Actions
  addUserBalance: async (balance) => {
    await handleAsync(() => userBalancesService.add(balance), 'تم إضافة الرصيد للمستخدم بنجاح');
  },
  updateUserBalance: async (id, data) => {
    await handleAsync(() => userBalancesService.update(id, data), 'تم تحديث الرصيد بنجاح');
  },
  deleteUserBalance: async (id) => {
    await handleAsync(() => userBalancesService.delete(id), 'تم حذف الرصيد');
  },

  // Letter Actions
  addLetter: async (letter) => {
    await handleAsync(() => lettersService.add(letter), '');
  },
  updateLetter: async (id, data) => {
    await handleAsync(() => lettersService.update(id, data), '');
  },
  deleteLetter: async (id) => {
    await handleAsync(() => lettersService.delete(id), '');
  },
}));
