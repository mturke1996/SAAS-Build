import type { Invoice, Payment, StandaloneDebt, FinancialSummary, MonthlyData } from '../types';
import dayjs from 'dayjs';
import 'dayjs/locale/ar';

// تعيين اللغة العربية
dayjs.locale('ar');

export const formatCurrency = (amount: number): string => {
  const rounded = Math.round(amount);
  return `${rounded.toLocaleString()} د.ل`;
};

export const calculateInvoiceTotal = (
  items: { quantity: number; unitPrice: number }[],
  taxRate: number = 0
): { subtotal: number; taxAmount: number; total: number } => {
  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const taxAmount = subtotal * (taxRate / 100);
  const total = subtotal + taxAmount;

  return { subtotal, taxAmount, total };
};

export const calculateFinancialSummary = (
  invoices: Invoice[],
  payments: Payment[],
  debts: StandaloneDebt[] // Updated to use StandaloneDebt
): FinancialSummary => {
  const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.total, 0);
  
  // Total collected includes payments on invoices AND partial payments on standalone debts?
  // For simplicity based on previous project:
  const totalCollectedOnInvoices = payments.reduce((sum, payment) => sum + payment.amount, 0);
  
  // If we consider standalone debts
  const totalDebtAmount = debts.reduce((sum, debt) => sum + debt.amount, 0);
  const totalDebtPaid = debts.reduce((sum, debt) => sum + debt.paidAmount, 0);
  
  // Total Collected across system
  const totalCollected = totalCollectedOnInvoices + totalDebtPaid;
  
  // Outstanding
  const outstandingInvoices = totalInvoiced - totalCollectedOnInvoices;
  const outstandingDebts = debts.reduce((sum, debt) => sum + debt.remainingAmount, 0);
  
  const totalOutstanding = outstandingInvoices + outstandingDebts;

  // Monthly Data Calculation
  const monthlyMap = new Map<string, MonthlyData>();

  invoices.forEach((invoice) => {
    const date = dayjs(invoice.issueDate);
    const key = `${date.year()}-${date.month()}`;

    if (!monthlyMap.has(key)) {
      monthlyMap.set(key, {
        month: date.month() + 1,
        year: date.year(),
        invoiced: 0,
        collected: 0,
        expenses: 0, // Need expenses array passed in to calculate this accurately here, or do separate loop
      });
    }

    const monthData = monthlyMap.get(key)!;
    monthData.invoiced += invoice.total;
  });

  payments.forEach((payment) => {
    const date = dayjs(payment.paymentDate);
    const key = `${date.year()}-${date.month()}`;

    if (monthlyMap.has(key)) {
      const monthData = monthlyMap.get(key)!;
      monthData.collected += payment.amount;
    }
  });

  const monthlyData = Array.from(monthlyMap.values()).sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year;
    return a.month - b.month;
  });

  // Note: Expenses summary logic needs the expenses array, which isn't passed here in the original
  // We can update this function later when integrating the Dashboard

  return {
    totalInvoiced,
    totalCollected,
    totalExpenses: 0, // Placeholder
    netIncome: totalCollected, // Placeholder
    outstandingDebts: totalOutstanding,
    monthlyData,
  };
};

export const getInvoiceStatus = (invoice: Invoice): Invoice['status'] => {
  if (invoice.status === 'paid') return 'paid';
  if (dayjs(invoice.dueDate).isBefore(dayjs(), 'day')) return 'overdue';
  return invoice.status;
};

export const calculateProgress = (total: number, current: number): number => {
  if (total === 0) return 0;
  return Math.min(100, Math.max(0, (current / total) * 100));
};
