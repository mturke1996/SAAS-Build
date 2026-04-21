import { useMemo } from 'react';
import dayjs from 'dayjs';
import { useAuthStore } from '../../stores/useAuthStore';
import { useDataStore } from '../../stores/useDataStore';
import { useGlobalFundStore } from '../../stores/useGlobalFundStore';

export type MyFundStats = { deposited: number; spent: number; remaining: number };

/**
 * Per-user custody (عهدة) balance: FIFO across deposits vs expenses — same logic as ExpensesPage / FundPage.
 */
export function useMyFundStats(): MyFundStats | null {
  const { expenses } = useDataStore();
  const { user } = useAuthStore();
  const { transactions, getUserStats } = useGlobalFundStore();

  return useMemo(() => {
    if (!user) return null;
    const uid = user.id;
    const userName = user.displayName || '';

    const deposits = [
      ...transactions.filter(
        (t) =>
          t.type === 'deposit' &&
          ((uid && t.userId === uid) || (userName && t.userName === userName))
      ),
    ].sort((a, b) => dayjs(a.createdAt).diff(dayjs(b.createdAt)));

    if (deposits.length === 0) {
      const storeStats = uid ? getUserStats(uid) : null;
      if (storeStats && storeStats.deposited > 0) {
        return {
          deposited: storeStats.deposited,
          spent: storeStats.withdrawn,
          remaining: storeStats.remaining,
        };
      }
      return null;
    }

    const custodies = deposits.map((tx) => ({
      createdAt: tx.createdAt,
      amount: tx.amount,
      remaining: tx.amount,
      spent: 0,
    }));

    const allExp = [
      ...expenses.filter(
        (e) => (uid && e.userId === uid) || (userName && e.createdBy === userName)
      ),
    ].sort((a, b) => dayjs(a.createdAt).diff(dayjs(b.createdAt)));

    allExp.forEach((exp) => {
      let rem = exp.amount;
      const expTime = dayjs(exp.createdAt);
      for (let i = 0; i < custodies.length; i++) {
        const c = custodies[i];
        if (rem <= 0) break;
        if (expTime.isBefore(dayjs(c.createdAt))) continue;
        if (c.remaining <= 0) {
          const hasNext = custodies
            .slice(i + 1)
            .some((nc) => !expTime.isBefore(dayjs(nc.createdAt)));
          if (hasNext) continue;
        }
        const take = Math.min(rem, Math.max(c.remaining, 0));
        if (take > 0) {
          c.spent += take;
          c.remaining -= take;
          rem -= take;
        }
        if (rem > 0) {
          const hasNext = custodies
            .slice(i + 1)
            .some((nc) => !expTime.isBefore(dayjs(nc.createdAt)));
          if (!hasNext) {
            c.spent += rem;
            c.remaining -= rem;
            rem = 0;
          }
        }
      }
    });

    for (let i = 0; i < custodies.length - 1; i++) {
      if (custodies[i].remaining < 0) {
        const deficit = Math.abs(custodies[i].remaining);
        custodies[i + 1].remaining -= deficit;
        custodies[i + 1].spent += deficit;
        custodies[i].remaining = 0;
      }
    }

    const totalDeposited = custodies.reduce((s, c) => s + c.amount, 0);
    const totalSpent = custodies.reduce((s, c) => s + c.spent, 0);
    const totalRemaining = custodies.reduce((s, c) => s + c.remaining, 0);
    return { deposited: totalDeposited, spent: totalSpent, remaining: totalRemaining };
  }, [transactions, expenses, user, getUserStats]);
}
