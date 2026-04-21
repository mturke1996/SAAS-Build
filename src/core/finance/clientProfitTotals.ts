import type { Client, Payment } from '../../types';

/**
 * Gross profit per client matches ClientProfilePage: (sum of payments × profit%) / 100.
 * Aggregates across all clients for dashboard KPIs.
 */
export function computeClientsProfitSummary(clients: Client[], payments: Payment[]) {
  const paidByClient = new Map<string, number>();
  for (const p of payments) {
    paidByClient.set(p.clientId, (paidByClient.get(p.clientId) || 0) + p.amount);
  }

  let totalGrossProfit = 0;
  let clientsWithProfitRule = 0;

  for (const c of clients) {
    const totalPaid = paidByClient.get(c.id) || 0;
    const pct = c.profitPercentage ?? 0;
    if (totalPaid > 0 && pct > 0) {
      totalGrossProfit += (totalPaid * pct) / 100;
      clientsWithProfitRule++;
    }
  }

  return { totalGrossProfit, clientsWithProfitRule };
}
