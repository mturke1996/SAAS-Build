// @ts-nocheck
import { useState, useMemo, useEffect, useRef } from 'react';
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import {
  Phone, Edit, Delete, Add, Search, Share, PictureAsPdf,
  Payment, TrendingUp, TrendingDown, CreditCard, Business, Person,
  AccountBalanceWallet, Description, PostAdd, PersonAdd, CalendarToday,
  WarningAmber, NoteAlt, CheckCircle, ChevronLeft, ChevronRight,
  ExpandMore, ExpandLess,
} from '@mui/icons-material';
import dayjs from 'dayjs';
import 'dayjs/locale/ar';
import toast from 'react-hot-toast';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { collection, query, onSnapshot } from 'firebase/firestore';

import { useDataStore } from '../../store/useDataStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useAppLockStore } from '../../store/useAppLockStore';
import { useGlobalFundStore } from '../../store/useGlobalFundStore';
import { useBrand } from '../../config/BrandProvider';
import { db } from '../../config/firebase';
import {
  formatCurrency, formatDate, getExpenseCategoryLabel, expenseCategories,
} from '../../utils/formatters';
import { downloadPdf, sharePdf } from '../../utils/pdfService';
import {
  ExpensesPDF, PaymentsPDF, WorkersPDF, DebtsPDF, FullReportPDF,
} from '../../features/pdf/ClientReportsPDF';
import {
  Button, Input, Sheet, Modal,
} from '../../design-system/primitives';
import { cn } from '../../design-system/primitives/cn';
import { countUp } from '../../core/motion/presets';
import type {
  Payment as PaymentType, Expense, StandaloneDebt, Worker, UserBalance,
} from '../../types';

dayjs.locale('ar');

/* ═══════════════════════════════════════════════════════════════════════════
   VALIDATION SCHEMAS
═══════════════════════════════════════════════════════════════════════════ */

const clientSchema = z.object({
  name: z.string().min(2),
  email: z.string().optional(),
  phone: z.string().min(8),
  address: z.string().min(3),
  type: z.enum(['company', 'individual']),
});

const workerSchema = z.object({
  name: z.string().min(1, 'مطلوب'),
  jobType: z.string().optional(),
  totalAmount: z.preprocess(
    (v) => (v === '' ? undefined : parseFloat(v as string)),
    z.number().min(0).optional()
  ),
});

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════════════════════════ */

export const ClientProfilePage = () => {
  const { id: clientId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const brand = useBrand();
  const rtl = brand.direction === 'rtl';
  const { user } = useAuthStore();
  const { canAccess } = useAppLockStore();
  const { transactions: fundTransactions, initialize: initFund } = useGlobalFundStore();

  const {
    clients, payments, expenses, standaloneDebts, invoices,
    addPayment, updatePayment, deletePayment,
    addExpense, updateExpense, deleteExpense,
    addStandaloneDebt, updateStandaloneDebt, deleteStandaloneDebt,
    updateClient, deleteClient,
    workers, addWorker, updateWorker, deleteWorker,
    userBalances, addUserBalance, updateUserBalance, deleteUserBalance,
  } = useDataStore();

  const client = clients.find((c) => c.id === clientId);

  // ─── Sheet / dialog state ──────────────────────────────────────────────
  const [activeSheet, setActiveSheet] = useState<
    'expenses' | 'payments' | 'debts' | 'workers' | 'balances' | null
  >(null);
  const [activeForm, setActiveForm] = useState<
    | { kind: 'payment'; edit?: PaymentType | null }
    | { kind: 'expense'; edit?: Expense | null; presetWorker?: Worker | null }
    | { kind: 'debt'; edit?: StandaloneDebt | null }
    | { kind: 'worker'; edit?: Worker | null }
    | { kind: 'balance'; edit?: UserBalance | null }
    | { kind: 'editClient' }
    | { kind: 'profit' }
    | null
  >(null);
  const [profitPercentage, setProfitPercentage] = useState('');
  const [systemUsers, setSystemUsers] = useState<any[]>([]);
  const [pdfLoading, setPdfLoading] = useState(false);

  useEffect(() => {
    const u = initFund();
    return u;
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'users'));
    const unsub = onSnapshot(q, (snap) => {
      setSystemUsers(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (client) setProfitPercentage(client.profitPercentage?.toString() || '');
  }, [client?.id, client?.profitPercentage]);

  // ─── Derived data ──────────────────────────────────────────────────────
  const clientExpenses = useMemo(
    () =>
      expenses
        .filter((e) => e.clientId === clientId)
        .sort((a, b) => dayjs(b.createdAt).diff(dayjs(a.createdAt))),
    [expenses, clientId]
  );
  const clientPayments = useMemo(
    () =>
      payments
        .filter((p) => p.clientId === clientId)
        .sort((a, b) => dayjs(b.paymentDate).diff(dayjs(a.paymentDate))),
    [payments, clientId]
  );
  const clientDebts = useMemo(
    () =>
      standaloneDebts
        .filter((d) => d.clientId === clientId)
        .sort((a, b) => dayjs(b.date).diff(dayjs(a.date))),
    [standaloneDebts, clientId]
  );
  const clientWorkers = useMemo(() => {
    const works = workers
      .filter((w) => w.clientId === clientId)
      .sort((a, b) => dayjs(b.createdAt).diff(dayjs(a.createdAt)));
    return works.map((w) => {
      const paid = expenses
        .filter((e) => e.workerId === w.id)
        .reduce((s, e) => s + e.amount, 0);
      return { ...w, paidAmount: paid, remainingAmount: w.totalAmount - paid };
    });
  }, [workers, expenses, clientId]);

  const clientUserBalances = useMemo(
    () =>
      userBalances
        .filter((b) => b.clientId === clientId)
        .sort((a, b) => dayjs(b.createdAt).diff(dayjs(a.createdAt))),
    [userBalances, clientId]
  );

  // ─── User-ID map (Firebase Auth UID ↔ Firestore doc.id ↔ displayName) ──
  const userIdMap = useMemo(() => {
    const uidToDoc: Record<string, string> = {};
    const docToUid: Record<string, string> = {};
    const nameToUid: Record<string, string> = {};
    systemUsers.forEach((u: any) => {
      const authUid = u.uid || u.id;
      const docId = u.id;
      uidToDoc[authUid] = docId;
      docToUid[docId] = authUid;
      if (u.displayName) nameToUid[u.displayName] = authUid;
    });
    return { uidToDoc, docToUid, nameToUid };
  }, [systemUsers]);

  const userBalancesSummary = useMemo(() => {
    const summary: Record<
      string,
      { given: number; spent: number; remaining: number; expenses: any[]; name: string; minTime: string }
    > = {};
    const sortedBalances = [...clientUserBalances].sort((a, b) =>
      dayjs(a.createdAt).diff(dayjs(b.createdAt))
    );
    sortedBalances.forEach((b) => {
      let k = b.userId;
      if (k && userIdMap.docToUid[k]) k = userIdMap.docToUid[k];
      if (!k && b.userName && userIdMap.nameToUid[b.userName]) k = userIdMap.nameToUid[b.userName];
      if (!k) k = b.userId || b.userName || 'unknown';
      const currentUserData = systemUsers.find((u: any) => (u.uid || u.id) === k);
      const actualName = currentUserData ? currentUserData.displayName : b.userName || 'مستخدم';
      if (!summary[k])
        summary[k] = { given: 0, spent: 0, remaining: 0, expenses: [], name: actualName, minTime: b.createdAt };
      if (currentUserData) summary[k].name = actualName;
      summary[k].given += b.amount;
      summary[k].remaining += b.amount;
    });
    clientExpenses.forEach((e) => {
      let k = e.userId;
      if (k && userIdMap.docToUid[k]) k = userIdMap.docToUid[k];
      if (!k && e.createdBy && userIdMap.nameToUid[e.createdBy]) k = userIdMap.nameToUid[e.createdBy];
      if (!k) k = e.userId || e.createdBy || 'المستخدم';
      if (summary[k] && summary[k].minTime) {
        if (dayjs(e.createdAt).isAfter(dayjs(summary[k].minTime).subtract(1, 'minute'))) {
          summary[k].spent += e.amount;
          summary[k].remaining -= e.amount;
          summary[k].expenses.push(e);
        }
      }
    });
    return summary;
  }, [clientUserBalances, clientExpenses, systemUsers, userIdMap]);

  const activeUserKey = user?.id || '';
  const currentUserBalanceInfo = activeUserKey ? userBalancesSummary[activeUserKey] : null;
  const depletedBalances = useMemo(
    () => Object.entries(userBalancesSummary).filter(([, b]) => b.given > 0 && b.remaining <= 0),
    [userBalancesSummary]
  );

  // ─── Global fund stats (FIFO) ──────────────────────────────────────────
  const globalFundStats = useMemo(() => {
    if (!user) return null;
    const uid = user.id;
    const userName = user.displayName || '';
    const deposits = [
      ...fundTransactions.filter(
        (t) =>
          t.type === 'deposit' &&
          ((uid && t.userId === uid) || (userName && t.userName === userName))
      ),
    ].sort((a, b) => dayjs(a.createdAt).diff(dayjs(b.createdAt)));
    if (deposits.length === 0) return null;
    const custodies = deposits.map((tx) => ({ createdAt: tx.createdAt, amount: tx.amount, remaining: tx.amount, spent: 0 }));
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
          const hasNext = custodies.slice(i + 1).some((nc) => !expTime.isBefore(dayjs(nc.createdAt)));
          if (hasNext) continue;
        }
        const take = Math.min(rem, Math.max(c.remaining, 0));
        if (take > 0) {
          c.spent += take;
          c.remaining -= take;
          rem -= take;
        }
        if (rem > 0) {
          const hasNext = custodies.slice(i + 1).some((nc) => !expTime.isBefore(dayjs(nc.createdAt)));
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
  }, [fundTransactions, expenses, user]);

  // ─── Financial summary ────────────────────────────────────────────────
  const summary = useMemo(() => {
    const totalExpenses = clientExpenses.reduce((s, e) => s + e.amount, 0);
    const totalDebts = clientDebts.reduce((s, d) => s + d.remainingAmount, 0);
    const totalPaid = clientPayments.reduce((s, p) => s + p.amount, 0);
    const totalWorkersDue = clientWorkers.reduce((s, w) => s + w.remainingAmount, 0);
    const totalWorkersAgreed = clientWorkers.reduce((s, w) => s + w.totalAmount, 0);
    const totalWorkersPaid = clientWorkers.reduce((s, w) => s + w.paidAmount, 0);
    const pct = client?.profitPercentage || 0;
    const profit = totalPaid > 0 && pct > 0 ? (totalPaid * pct) / 100 : 0;
    const totalObligations = totalExpenses + totalDebts;
    const remaining = totalPaid - profit - totalObligations;
    return {
      totalExpenses, totalDebts, totalPaid, totalWorkersDue, totalWorkersAgreed,
      totalWorkersPaid, remaining, profit, profitPercentage: pct, totalObligations,
    };
  }, [clientExpenses, clientDebts, clientPayments, clientWorkers, client]);

  // ─── PDF helpers ──────────────────────────────────────────────────────
  const withPdfLoading = async (fn: () => Promise<void>) => {
    setPdfLoading(true);
    try {
      await fn();
    } catch (e) {
      console.error('PDF error:', e);
      toast.error('فشل في إنشاء PDF');
    } finally {
      setPdfLoading(false);
    }
  };
  const pdfFull = () => withPdfLoading(() => downloadPdf(
    React.createElement(FullReportPDF, { client, expenses: clientExpenses, payments: clientPayments, debts: clientDebts, workers: clientWorkers, summary }),
    `تقرير-${client?.name}`,
  ));
  const sharePdfFull = () => withPdfLoading(() => sharePdf(
    React.createElement(FullReportPDF, { client, expenses: clientExpenses, payments: clientPayments, debts: clientDebts, workers: clientWorkers, summary }),
    `تقرير-${client?.name}`,
    `التقرير الشامل - ${client?.name}`,
  ));
  const pdfExpenses = () => withPdfLoading(() => downloadPdf(
    React.createElement(ExpensesPDF, { client, expenses: clientExpenses, total: summary.totalExpenses }),
    `مصروفات-${client?.name}`,
  ));
  const shareExpenses = () => withPdfLoading(() => sharePdf(
    React.createElement(ExpensesPDF, { client, expenses: clientExpenses, total: summary.totalExpenses }),
    `مصروفات-${client?.name}`,
    `كشف المصروفات - ${client?.name}`,
  ));
  const pdfPayments = () => withPdfLoading(() => downloadPdf(
    React.createElement(PaymentsPDF, { client, payments: clientPayments, total: summary.totalPaid }),
    `مدفوعات-${client?.name}`,
  ));
  const sharePayments = () => withPdfLoading(() => sharePdf(
    React.createElement(PaymentsPDF, { client, payments: clientPayments, total: summary.totalPaid }),
    `مدفوعات-${client?.name}`,
    `كشف المدفوعات - ${client?.name}`,
  ));
  const pdfDebts = () => withPdfLoading(() => downloadPdf(
    React.createElement(DebtsPDF, { client, debts: clientDebts, total: summary.totalDebts }),
    `ديون-${client?.name}`,
  ));
  const shareDebts = () => withPdfLoading(() => sharePdf(
    React.createElement(DebtsPDF, { client, debts: clientDebts, total: summary.totalDebts }),
    `ديون-${client?.name}`,
    `كشف الديون - ${client?.name}`,
  ));
  const pdfWorkers = () => withPdfLoading(() => downloadPdf(
    React.createElement(WorkersPDF, {
      client, workers: clientWorkers,
      totalAgreed: summary.totalWorkersAgreed,
      totalPaid: summary.totalWorkersPaid,
      totalDue: summary.totalWorkersDue,
    }),
    `عمال-${client?.name}`,
  ));
  const shareWorkersPdf = () => withPdfLoading(() => sharePdf(
    React.createElement(WorkersPDF, {
      client, workers: clientWorkers,
      totalAgreed: summary.totalWorkersAgreed,
      totalPaid: summary.totalWorkersPaid,
      totalDue: summary.totalWorkersDue,
    }),
    `عمال-${client?.name}`,
    `كشف العمال - ${client?.name}`,
  ));

  // ─── Business handlers ────────────────────────────────────────────────
  const handleDeleteClient = async () => {
    if (!clientId || !window.confirm('هل أنت متأكد من حذف هذا العميل؟')) return;
    try {
      await deleteClient(clientId);
      navigate('/clients');
    } catch {
      toast.error('خطأ في الحذف');
    }
  };
  const handleSaveProfit = async () => {
    if (!clientId) return;
    const pct = parseFloat(profitPercentage);
    if (isNaN(pct) || pct < 0 || pct > 100) {
      toast.error('النسبة يجب أن تكون بين 0 و 100');
      return;
    }
    try {
      await updateClient(clientId, { profitPercentage: pct });
      window.dispatchEvent(new Event('profitPercentageUpdated'));
      toast.success('تم حفظ النسبة');
      setActiveForm(null);
    } catch {
      toast.error('خطأ');
    }
  };

  // ─── Hero KPI count-up animation ──────────────────────────────────────
  const heroRef = useRef<HTMLDivElement>(null);
  const paidRef = useRef<HTMLSpanElement>(null);
  const netRef = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (!reduced) {
        gsap.from('[data-reveal]', {
          autoAlpha: 0,
          y: 10,
          duration: 0.32,
          ease: 'power2.out',
          stagger: 0.05,
          delay: 0.02,
        });
      }
      if (paidRef.current) countUp(paidRef.current, summary.totalPaid, {
        duration: reduced ? 0.01 : 0.9,
        format: formatCurrency,
      });
      if (netRef.current) countUp(netRef.current, summary.remaining, {
        duration: reduced ? 0.01 : 0.9,
        format: formatCurrency,
      });
    },
    { scope: heroRef, dependencies: [summary.totalPaid, summary.remaining] }
  );

  if (!client) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-center px-4">
        <div className="h-16 w-16 rounded-2xl bg-surface-sunken flex items-center justify-center">
          <Person sx={{ fontSize: 32, color: 'var(--text-tertiary)' }} />
        </div>
        <div className="text-fg font-semibold">العميل غير موجود</div>
        <Button variant="outline" onClick={() => navigate('/clients')}>العودة إلى قائمة العملاء</Button>
      </div>
    );
  }

  const ChevronStart = rtl ? ChevronRight : ChevronLeft;
  const isCompany = client.type === 'company';
  const initial = client.name?.charAt(0)?.toUpperCase() || 'C';

  // ─── Module tiles (interactive grid, each with live stat) ────────────
  type Tone = 'brand' | 'success' | 'danger' | 'warning' | 'info' | 'amber';
  interface ModuleTile {
    key: string;
    title: string;
    count: number;
    amount: number;
    Icon: any;
    tone: Tone;
    module: string;
    onClick: () => void;
  }
  const modules: ModuleTile[] = [
    { key: 'expenses', title: 'المصروفات', count: clientExpenses.length, amount: summary.totalExpenses, Icon: TrendingDown, tone: 'danger',  module: 'expenses', onClick: () => setActiveSheet('expenses') },
    { key: 'payments', title: 'المدفوعات', count: clientPayments.length, amount: summary.totalPaid,     Icon: Payment,       tone: 'success', module: 'payments', onClick: () => setActiveSheet('payments') },
    { key: 'debts',    title: 'الديون',    count: clientDebts.length,    amount: summary.totalDebts,    Icon: CreditCard,    tone: 'warning', module: 'debts',    onClick: () => setActiveSheet('debts') },
    { key: 'workers',  title: 'العمال',    count: clientWorkers.length,  amount: summary.totalWorkersDue, Icon: PersonAdd,   tone: 'info',    module: 'workers',  onClick: () => setActiveSheet('workers') },
    { key: 'balances', title: 'العهد',     count: clientUserBalances.length, amount: Object.values(userBalancesSummary).reduce((s, b) => s + b.remaining, 0), Icon: AccountBalanceWallet, tone: 'amber', module: 'balances', onClick: () => setActiveSheet('balances') },
    { key: 'profit',   title: 'الأرباح',   count: summary.profitPercentage, amount: summary.profit,     Icon: TrendingUp,    tone: 'brand',   module: 'stats',    onClick: () => setActiveForm({ kind: 'profit' }) },
  ].filter((m) => canAccess(m.module as any));

  return (
    <div ref={heroRef} className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pt-4 pb-10 lg:pt-8 lg:pb-14 space-y-5 lg:space-y-7">
      {/* ═══ Hero Identity — avatar + name + phone + type chip ═══ */}
      <section
        data-reveal
        className="relative overflow-hidden rounded-3xl grain text-white"
        style={{
          background: 'linear-gradient(135deg, #1B0F3B 0%, #4C1D95 45%, #6D28D9 100%)',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        <div
          aria-hidden
          className="absolute -top-16 -right-12 w-[260px] h-[260px] rounded-full blur-3xl"
          style={{ background: 'radial-gradient(closest-side, #F59E0B 0%, transparent 70%)', opacity: 0.35 }}
        />
        <div
          aria-hidden
          className="absolute -bottom-20 -left-16 w-[240px] h-[240px] rounded-full blur-3xl"
          style={{ background: 'radial-gradient(closest-side, #8B5CF6, transparent)', opacity: 0.45 }}
        />

        <div className="relative p-5 sm:p-7 lg:p-8">
          <div className="flex items-start gap-4">
            {/* Big avatar */}
            <div
              aria-hidden
              className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl shrink-0 flex items-center justify-center text-2xl sm:text-3xl font-extrabold backdrop-blur-md border border-white/20"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.18), rgba(255,255,255,0.04))',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2)',
                color: '#ffffff',
              }}
            >
              {initial}
            </div>

            {/* Name + chips */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                <span
                  className="inline-flex items-center gap-1 h-6 px-2 rounded-full text-2xs font-bold backdrop-blur border"
                  style={{
                    background: isCompany ? 'rgba(139,92,246,0.22)' : 'rgba(245,158,11,0.22)',
                    borderColor: isCompany ? 'rgba(167,139,250,0.4)' : 'rgba(251,191,36,0.4)',
                    color: '#ffffff',
                  }}
                >
                  {isCompany ? <Business sx={{ fontSize: 12 }} /> : <Person sx={{ fontSize: 12 }} />}
                  {isCompany ? 'شركة' : 'فرد'}
                </span>
                {summary.profitPercentage > 0 && (
                  <span className="inline-flex items-center gap-1 h-6 px-2 rounded-full bg-white/10 backdrop-blur text-white/90 text-2xs font-bold border border-white/15">
                    <TrendingUp sx={{ fontSize: 12 }} />
                    {summary.profitPercentage}%
                  </span>
                )}
              </div>
              <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight leading-tight truncate">
                {client.name}
              </h1>
              <div className="flex flex-wrap gap-2 mt-2.5">
                <a
                  href={`tel:${client.phone}`}
                  className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full bg-white/12 hover:bg-white/20 backdrop-blur border border-white/15 text-white/95 text-xs font-semibold transition-colors"
                >
                  <Phone sx={{ fontSize: 14 }} />
                  <span className="font-num tabular" dir="ltr">{client.phone}</span>
                </a>
                {client.address && (
                  <span className="inline-flex items-center gap-1 h-8 px-3 rounded-full bg-white/8 border border-white/10 text-white/75 text-xs font-medium">
                    {client.address}
                  </span>
                )}
              </div>
            </div>

            {/* Edit button */}
            <button
              onClick={() => setActiveForm({ kind: 'editClient' })}
              aria-label="تعديل العميل"
              className="shrink-0 h-10 w-10 flex items-center justify-center rounded-xl bg-white/12 hover:bg-white/20 text-white/95 backdrop-blur border border-white/15 transition-colors duration-fast pressable cursor-pointer"
            >
              <Edit sx={{ fontSize: 18 }} />
            </button>
          </div>

          {/* Inline financial headline */}
          {canAccess('stats') && (
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 p-3.5">
                <div className="text-2xs text-white/70 font-bold tracking-wider">إجمالي المحصّل</div>
                <div className="text-xl sm:text-2xl font-extrabold font-num tabular mt-0.5 text-white">
                  <span ref={paidRef}>{formatCurrency(0)}</span>
                </div>
              </div>
              <div
                className="rounded-2xl backdrop-blur-md border p-3.5"
                style={{
                  background: summary.remaining >= 0 ? 'rgba(52,211,153,0.18)' : 'rgba(248,113,113,0.2)',
                  borderColor: summary.remaining >= 0 ? 'rgba(52,211,153,0.4)' : 'rgba(248,113,113,0.4)',
                }}
              >
                <div className="text-2xs text-white/80 font-bold tracking-wider">
                  {summary.remaining >= 0 ? 'الصافي المتبقي' : 'عجز مالي'}
                </div>
                <div className="text-xl sm:text-2xl font-extrabold font-num tabular mt-0.5" style={{ color: summary.remaining >= 0 ? '#d1fae5' : '#fecaca' }}>
                  <span ref={netRef}>{formatCurrency(0)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ═══ Alerts ═══ */}
      {canAccess('stats') && (summary.totalExpenses > summary.totalPaid || summary.remaining < 0 || depletedBalances.length > 0) && (
        <section data-reveal className="space-y-2">
          {summary.totalExpenses > summary.totalPaid && (
            <AlertBanner
              tone="danger"
              icon={<TrendingDown sx={{ fontSize: 18 }} />}
              text="تنبيه: إجمالي المصروفات تجاوز قيمة المدفوعات!"
            />
          )}
          {summary.remaining < 0 && (
            <AlertBanner
              tone="warning"
              icon={<WarningAmber sx={{ fontSize: 18 }} />}
              text={`الرصيد الحالي بالسالب — عجز بقيمة ${formatCurrency(Math.abs(summary.remaining))}`}
            />
          )}
          {depletedBalances.map(([uid, data]) => (
            <AlertBanner
              key={uid}
              tone="warning"
              icon={<WarningAmber sx={{ fontSize: 18 }} />}
              text={`نفد رصيد العهدة للمستخدم "${data.name}" (مصروف: ${formatCurrency(data.spent)})`}
            />
          ))}
        </section>
      )}

      {/* ═══ Bento KPI Grid (4 tiles: profit / expenses / debts / remaining) ═══ */}
      {canAccess('stats') && (
        <section data-reveal className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
          <KpiTile
            label="الأرباح"
            value={formatCurrency(summary.profit)}
            sub={summary.profitPercentage > 0 ? `${summary.profitPercentage}%` : 'لم تُحدد النسبة'}
            Icon={TrendingUp}
            tone="brand"
            onClick={() => setActiveForm({ kind: 'profit' })}
          />
          <KpiTile
            label="المصروفات"
            value={formatCurrency(summary.totalExpenses)}
            sub={`${clientExpenses.length} سجل`}
            Icon={TrendingDown}
            tone="danger"
            onClick={() => setActiveSheet('expenses')}
          />
          <KpiTile
            label="الديون"
            value={formatCurrency(summary.totalDebts)}
            sub={`${clientDebts.length} دين`}
            Icon={CreditCard}
            tone="warning"
            onClick={() => setActiveSheet('debts')}
          />
          <KpiTile
            label="العمال"
            value={formatCurrency(summary.totalWorkersDue)}
            sub={`${clientWorkers.length} عامل`}
            Icon={PersonAdd}
            tone="info"
            onClick={() => setActiveSheet('workers')}
          />
        </section>
      )}

      {/* ═══ Primary CTA — new invoice ═══ */}
      {canAccess('invoices') && (
        <section data-reveal>
          <Button
            size="lg"
            block
            onClick={() => navigate(`/invoices/new?clientId=${clientId}`)}
            leftIcon={<PostAdd sx={{ fontSize: 20 }} />}
            className="btn-primary-glow sm:!max-w-xs"
          >
            إنشاء فاتورة جديدة
          </Button>
        </section>
      )}

      {/* ═══ Module Grid ═══ */}
      <section data-reveal className="space-y-3">
        <h2 className="text-sm font-bold text-fg">الأقسام</h2>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {modules.map((m) => (
            <ModuleCard
              key={m.key}
              title={m.title}
              count={m.count}
              amount={m.amount}
              Icon={m.Icon}
              tone={m.tone}
              onClick={m.onClick}
              ChevronStart={ChevronStart}
              isProfitTile={m.key === 'profit'}
            />
          ))}
        </div>
      </section>

      {/* ═══ PDF reports ═══ */}
      {canAccess('stats') && (
        <section data-reveal className="space-y-3">
          <h2 className="text-sm font-bold text-fg">التقرير الشامل</h2>
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              block
              leftIcon={pdfLoading ? <span className="inline-block h-4 w-4 rounded-full border-2 border-current border-r-transparent animate-spin" /> : <PictureAsPdf sx={{ fontSize: 18 }} />}
              onClick={pdfFull}
              disabled={pdfLoading}
            >
              تحميل PDF
            </Button>
            <Button
              variant="outline"
              block
              leftIcon={<Share sx={{ fontSize: 18 }} />}
              onClick={sharePdfFull}
              disabled={pdfLoading}
            >
              مشاركة التقرير
            </Button>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
         SHEETS (sub-views)
      ═══════════════════════════════════════════════════════════════════ */}

      <ExpensesSheet
        open={activeSheet === 'expenses'}
        onClose={() => setActiveSheet(null)}
        client={client}
        clientExpenses={clientExpenses}
        globalFundStats={globalFundStats}
        currentUserBalanceInfo={currentUserBalanceInfo}
        userName={user?.displayName || currentUserBalanceInfo?.name || ''}
        summary={summary}
        pdfLoading={pdfLoading}
        onAdd={() => setActiveForm({ kind: 'expense', edit: null })}
        onEdit={(e) => setActiveForm({ kind: 'expense', edit: e })}
        onDelete={async (id) => {
          if (!window.confirm('حذف هذا المصروف؟')) return;
          await deleteExpense(id);
          toast.success('تم الحذف');
        }}
        onDownloadPdf={pdfExpenses}
        onSharePdf={shareExpenses}
      />

      <PaymentsSheet
        open={activeSheet === 'payments'}
        onClose={() => setActiveSheet(null)}
        clientPayments={clientPayments}
        summary={summary}
        pdfLoading={pdfLoading}
        onAdd={() => setActiveForm({ kind: 'payment', edit: null })}
        onEdit={(p) => setActiveForm({ kind: 'payment', edit: p })}
        onDelete={async (id) => {
          if (!window.confirm('حذف هذه الدفعة؟')) return;
          await deletePayment(id);
          toast.success('تم الحذف');
        }}
        onDownloadPdf={pdfPayments}
        onSharePdf={sharePayments}
      />

      <DebtsSheet
        open={activeSheet === 'debts'}
        onClose={() => setActiveSheet(null)}
        clientDebts={clientDebts}
        summary={summary}
        pdfLoading={pdfLoading}
        onAdd={() => setActiveForm({ kind: 'debt', edit: null })}
        onEdit={(d) => setActiveForm({ kind: 'debt', edit: d })}
        onDelete={async (id) => {
          if (!window.confirm('حذف هذا الدين؟')) return;
          await deleteStandaloneDebt(id);
          toast.success('تم الحذف');
        }}
        onDownloadPdf={pdfDebts}
        onSharePdf={shareDebts}
      />

      <WorkersSheet
        open={activeSheet === 'workers'}
        onClose={() => setActiveSheet(null)}
        clientWorkers={clientWorkers}
        summary={summary}
        pdfLoading={pdfLoading}
        onAdd={() => setActiveForm({ kind: 'worker', edit: null })}
        onEdit={(w) => setActiveForm({ kind: 'worker', edit: w })}
        onPay={(w) => setActiveForm({ kind: 'expense', edit: null, presetWorker: w })}
        onDelete={async (id) => {
          if (!window.confirm('حذف هذا العامل؟')) return;
          await deleteWorker(id);
          toast.success('تم الحذف');
        }}
        onDownloadPdf={pdfWorkers}
        onSharePdf={shareWorkersPdf}
      />

      <BalancesSheet
        open={activeSheet === 'balances'}
        onClose={() => setActiveSheet(null)}
        clientUserBalances={clientUserBalances}
        userBalancesSummary={userBalancesSummary}
        onAdd={() => setActiveForm({ kind: 'balance', edit: null })}
        onEdit={(b) => setActiveForm({ kind: 'balance', edit: b })}
        onDelete={async (id) => {
          if (!window.confirm('حذف حركة الرصيد؟')) return;
          await deleteUserBalance(id);
          toast.success('تم الحذف');
        }}
      />

      {/* ═══════════════════════════════════════════════════════════════════
         FORMS
      ═══════════════════════════════════════════════════════════════════ */}

      {activeForm?.kind === 'payment' && (
        <PaymentFormSheet
          edit={activeForm.edit}
          onClose={() => setActiveForm(null)}
          onSubmit={async (data) => {
            const amount = parseFloat(data.amount) || 0;
            try {
              if (activeForm.edit) {
                await updatePayment(activeForm.edit.id, {
                  amount,
                  paymentMethod: data.paymentMethod,
                  paymentDate: data.paymentDate,
                  invoiceId: data.invoiceId,
                  notes: data.notes,
                });
                toast.success('تم التعديل');
              } else {
                await addPayment({
                  id: crypto.randomUUID(),
                  invoiceId: data.invoiceId || '',
                  clientId: clientId!,
                  amount,
                  paymentMethod: data.paymentMethod,
                  paymentDate: data.paymentDate,
                  notes: data.notes || '',
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                  createdBy: user?.displayName || 'المستخدم',
                });
                toast.success('تمت الإضافة');
              }
              setActiveForm(null);
              setActiveSheet('payments');
            } catch {
              toast.error('خطأ');
            }
          }}
        />
      )}

      {activeForm?.kind === 'expense' && (
        <ExpenseFormSheet
          edit={activeForm.edit}
          presetWorker={activeForm.presetWorker}
          clientWorkers={clientWorkers}
          currentUserBalanceInfo={currentUserBalanceInfo}
          userName={user?.displayName || currentUserBalanceInfo?.name || ''}
          onClose={() => setActiveForm(null)}
          onSubmit={async (data) => {
            const amount = parseFloat(data.amount) || 0;
            const workerId = data.workerId || null;
            const workerName = workerId ? workers.find((w) => w.id === workerId)?.name : null;
            const userId = activeForm.edit?.userId || user?.id || '';
            const createdBy = activeForm.edit?.createdBy || user?.displayName || 'المستخدم';
            try {
              if (activeForm.edit) {
                await updateExpense(activeForm.edit.id, {
                  description: data.description, amount, category: data.category,
                  date: data.date, invoiceNumber: data.invoiceNumber, notes: data.notes,
                  workerId, workerName, userId, createdBy,
                });
                toast.success('تم التعديل');
              } else {
                await addExpense({
                  id: crypto.randomUUID(),
                  clientId: clientId!,
                  description: data.description, amount, category: data.category,
                  date: data.date, invoiceNumber: data.invoiceNumber || '',
                  notes: data.notes, isClosed: false,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                  workerId, workerName, userId, createdBy,
                });
                toast.success('تمت الإضافة');
              }
              setActiveForm(null);
              setActiveSheet('expenses');
            } catch {
              toast.error('خطأ');
            }
          }}
        />
      )}

      {activeForm?.kind === 'debt' && (
        <DebtFormSheet
          edit={activeForm.edit}
          onClose={() => setActiveForm(null)}
          onSubmit={async (data) => {
            const amount = parseFloat(data.amount) || 0;
            try {
              if (activeForm.edit) {
                const newPaid = Math.min(activeForm.edit.paidAmount, amount);
                await updateStandaloneDebt(activeForm.edit.id, {
                  partyName: data.partyName, description: data.description, amount,
                  paidAmount: newPaid, remainingAmount: Math.max(0, amount - newPaid),
                  status: amount - newPaid <= 0 ? 'paid' : 'unpaid',
                  date: data.date, notes: data.notes,
                });
                toast.success('تم التعديل');
              } else {
                await addStandaloneDebt({
                  id: crypto.randomUUID(),
                  clientId: clientId!,
                  partyType: 'external',
                  partyName: data.partyName, description: data.description,
                  amount, paidAmount: 0, remainingAmount: amount,
                  status: 'unpaid', date: data.date,
                  notes: data.notes || '',
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                });
                toast.success('تمت الإضافة');
              }
              setActiveForm(null);
              setActiveSheet('debts');
            } catch {
              toast.error('خطأ');
            }
          }}
        />
      )}

      {activeForm?.kind === 'worker' && (
        <WorkerFormSheet
          edit={activeForm.edit}
          onClose={() => setActiveForm(null)}
          onSubmit={async (data) => {
            const totalAmount = parseFloat(data.totalAmount) || 0;
            try {
              if (activeForm.edit) {
                await updateWorker(activeForm.edit.id, {
                  name: data.name, jobType: data.jobType, totalAmount, status: 'active',
                });
                toast.success('تم التعديل');
              } else {
                await addWorker({
                  id: crypto.randomUUID(),
                  clientId: clientId!,
                  name: data.name, jobType: data.jobType, totalAmount,
                  paidAmount: 0, remainingAmount: totalAmount, status: 'active',
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                });
                toast.success('تمت الإضافة');
              }
              setActiveForm(null);
              setActiveSheet('workers');
            } catch {
              toast.error('خطأ');
            }
          }}
        />
      )}

      {activeForm?.kind === 'balance' && (
        <BalanceFormSheet
          edit={activeForm.edit}
          systemUsers={systemUsers}
          onClose={() => setActiveForm(null)}
          onSubmit={async (data) => {
            const amount = parseFloat(data.amount) || 0;
            const assignedUser = systemUsers.find((u) => (u.uid || u.id) === data.userId);
            const userName = assignedUser ? assignedUser.displayName : user?.displayName || 'المستخدم';
            try {
              if (activeForm.edit) {
                await updateUserBalance(activeForm.edit.id, {
                  userId: data.userId, userName, amount, date: data.date, notes: data.notes,
                });
                toast.success('تم التعديل');
              } else {
                await addUserBalance({
                  id: crypto.randomUUID(),
                  clientId: clientId!,
                  userId: data.userId, userName, amount, date: data.date,
                  notes: data.notes || '',
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                  createdBy: user?.displayName || 'المستخدم',
                });
                toast.success('تمت الإضافة');
              }
              setActiveForm(null);
              setActiveSheet('balances');
            } catch {
              toast.error('خطأ');
            }
          }}
        />
      )}

      {activeForm?.kind === 'editClient' && (
        <EditClientFormSheet
          client={client}
          onClose={() => setActiveForm(null)}
          onSubmit={async (data) => {
            if (!clientId) return;
            try {
              await updateClient(clientId, data);
              toast.success('تم التحديث');
              setActiveForm(null);
            } catch {
              toast.error('خطأ');
            }
          }}
          onDelete={handleDeleteClient}
        />
      )}

      {/* Profit modal — small, centered (not a full sheet) */}
      <Modal
        open={activeForm?.kind === 'profit'}
        onClose={() => setActiveForm(null)}
        title="حساب الأرباح"
        description="النسبة تطبّق على إجمالي المدفوعات"
        maxWidth="sm"
      >
        <div className="space-y-3">
          <Input
            label="نسبة الربح"
            type="number"
            inputMode="decimal"
            value={profitPercentage}
            onChange={(e) => setProfitPercentage(e.target.value)}
            placeholder="مثال: 15"
            rightIcon={<span className="text-2xs font-semibold">%</span>}
          />
          {summary.profit > 0 && summary.profitPercentage > 0 && (
            <div
              className="rounded-lg p-3 text-sm font-semibold"
              style={{
                background: 'var(--brand-primary-soft)',
                color: 'var(--brand-primary)',
              }}
            >
              الربح الحالي: {formatCurrency(summary.profit)}
            </div>
          )}
          <div className="flex gap-2 pt-2">
            <Button variant="outline" block onClick={() => setActiveForm(null)}>إلغاء</Button>
            <Button block onClick={handleSaveProfit}>حفظ النسبة</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   SHARED COMPONENTS
═══════════════════════════════════════════════════════════════════════════ */

function toneVars(tone: 'brand' | 'success' | 'danger' | 'warning' | 'info' | 'amber') {
  switch (tone) {
    case 'success': return { fg: 'var(--brand-success)', soft: 'color-mix(in srgb, var(--brand-success) 12%, transparent)' };
    case 'danger':  return { fg: 'var(--brand-danger)',  soft: 'color-mix(in srgb, var(--brand-danger) 12%, transparent)' };
    case 'warning': return { fg: 'var(--brand-warning)', soft: 'color-mix(in srgb, var(--brand-warning) 14%, transparent)' };
    case 'info':    return { fg: 'var(--brand-info)',    soft: 'color-mix(in srgb, var(--brand-info) 12%, transparent)' };
    case 'amber':   return { fg: '#D97706',              soft: 'color-mix(in srgb, #F59E0B 14%, transparent)' };
    default:        return { fg: 'var(--brand-primary)', soft: 'var(--brand-primary-soft)' };
  }
}

function KpiTile({ label, value, sub, Icon, tone, onClick }: any) {
  const t = toneVars(tone);
  return (
    <button
      onClick={onClick}
      className={cn(
        'relative text-start bg-surface-panel border border-border rounded-2xl p-3.5 lg:p-4',
        'shadow-xs hover:shadow-md hover:border-strong transition-all duration-base',
        'cursor-pointer pressable focus:outline-none focus-visible:shadow-focus',
        'overflow-hidden'
      )}
      style={{ backgroundImage: `radial-gradient(140% 70% at 100% 0%, ${t.soft} 0%, transparent 60%)` }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xs uppercase tracking-wider text-fg-muted font-bold truncate">{label}</span>
        <span
          aria-hidden
          className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: t.soft, color: t.fg }}
        >
          <Icon sx={{ fontSize: 16 }} />
        </span>
      </div>
      <div
        className="text-base sm:text-lg lg:text-xl font-extrabold font-num tabular tracking-tight truncate"
        style={{ color: t.fg }}
      >
        {value}
      </div>
      <div className="text-2xs text-fg-muted mt-0.5 truncate">{sub}</div>
    </button>
  );
}

function ModuleCard({ title, count, amount, Icon, tone, onClick, ChevronStart, isProfitTile }: any) {
  const t = toneVars(tone);
  return (
    <button
      onClick={onClick}
      className={cn(
        'group text-start bg-surface-panel border border-border rounded-2xl p-3.5 lg:p-4',
        'shadow-xs hover:shadow-md hover:border-strong transition-all duration-base',
        'cursor-pointer pressable focus:outline-none focus-visible:shadow-focus',
        'min-h-[120px]'
      )}
    >
      <div className="flex items-start justify-between gap-2 h-full">
        <div className="flex-1 min-w-0">
          <span
            aria-hidden
            className="inline-flex h-10 w-10 rounded-xl items-center justify-center mb-2.5"
            style={{ background: t.soft, color: t.fg }}
          >
            <Icon sx={{ fontSize: 20 }} />
          </span>
          <div className="text-[0.9375rem] font-bold text-fg leading-snug truncate">{title}</div>
          <div className="text-2xs text-fg-muted mt-0.5 truncate font-num tabular">
            {isProfitTile
              ? count > 0
                ? `${count}% — ${formatCurrency(amount)}`
                : 'اضغط لتحديد النسبة'
              : `${count} سجل · ${formatCurrency(amount)}`}
          </div>
        </div>
        <ChevronStart
          sx={{ fontSize: 16 }}
          className="text-fg-muted group-hover:text-[color:var(--brand-primary)] transition-colors mt-1 shrink-0"
        />
      </div>
    </button>
  );
}

function AlertBanner({ tone, icon, text }: { tone: 'danger' | 'warning'; icon: React.ReactNode; text: string }) {
  const isDanger = tone === 'danger';
  return (
    <div
      className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-sm font-semibold"
      style={{
        background: isDanger
          ? 'color-mix(in srgb, var(--brand-danger) 10%, transparent)'
          : 'color-mix(in srgb, var(--brand-warning) 14%, transparent)',
        borderColor: isDanger
          ? 'color-mix(in srgb, var(--brand-danger) 30%, transparent)'
          : 'color-mix(in srgb, var(--brand-warning) 30%, transparent)',
        color: isDanger ? 'var(--brand-danger)' : '#92400E',
      }}
    >
      <span className="shrink-0" style={{ color: 'inherit' }}>{icon}</span>
      <span className="flex-1">{text}</span>
    </div>
  );
}

function PdfBar({ onDownload, onShare, loading }: { onDownload: () => void; onShare: () => void; loading: boolean }) {
  return (
    <div className="flex gap-2">
      <button
        onClick={onDownload}
        disabled={loading}
        className="flex-1 inline-flex items-center justify-center gap-1.5 h-9 rounded-lg bg-white/12 hover:bg-white/20 text-white/95 backdrop-blur border border-white/15 text-xs font-bold transition-colors disabled:opacity-50"
      >
        {loading ? (
          <span className="inline-block h-3.5 w-3.5 rounded-full border-2 border-white/90 border-r-transparent animate-spin" />
        ) : (
          <PictureAsPdf sx={{ fontSize: 14 }} />
        )}
        تحميل PDF
      </button>
      <button
        onClick={onShare}
        disabled={loading}
        className="flex-1 inline-flex items-center justify-center gap-1.5 h-9 rounded-lg bg-white/12 hover:bg-white/20 text-white/95 backdrop-blur border border-white/15 text-xs font-bold transition-colors disabled:opacity-50"
      >
        <Share sx={{ fontSize: 14 }} />
        مشاركة
      </button>
    </div>
  );
}

function AddHeaderButton({ onClick, label = 'إضافة' }: { onClick: () => void; label?: string }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 h-10 px-3 rounded-xl bg-white text-[color:var(--brand-primary)] hover:bg-white/95 font-bold text-sm pressable transition-colors shadow-xs shrink-0"
    >
      <Add sx={{ fontSize: 16 }} />
      {label}
    </button>
  );
}

function EmptyState({ Icon, title, sub, cta }: { Icon: any; title: string; sub?: string; cta?: React.ReactNode }) {
  return (
    <div className="bg-surface-panel border border-border rounded-2xl p-10 text-center mx-4 my-4">
      <div
        className="mx-auto h-14 w-14 rounded-2xl flex items-center justify-center mb-3"
        style={{ background: 'var(--brand-primary-soft)', color: 'var(--brand-primary)' }}
      >
        <Icon sx={{ fontSize: 28 }} />
      </div>
      <div className="text-fg font-bold">{title}</div>
      {sub && <div className="text-2xs text-fg-muted mt-1">{sub}</div>}
      {cta && <div className="mt-4">{cta}</div>}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   EXPENSES SHEET
═══════════════════════════════════════════════════════════════════════════ */

function ExpensesSheet({
  open, onClose, client, clientExpenses, globalFundStats, currentUserBalanceInfo,
  userName, summary, pdfLoading, onAdd, onEdit, onDelete, onDownloadPdf, onSharePdf,
}: any) {
  const [search, setSearch] = useState('');
  const [expandedBreakdown, setExpandedBreakdown] = useState(false);

  const filtered = useMemo(() => {
    if (!search) return clientExpenses;
    const q = search.toLowerCase();
    return clientExpenses.filter(
      (e: Expense) =>
        e.description.toLowerCase().includes(q) || e.category.toLowerCase().includes(q)
    );
  }, [clientExpenses, search]);

  const byUser = useMemo(() => {
    const totals: Record<string, number> = {};
    clientExpenses.forEach((e: Expense) => {
      const u = e.createdBy || 'المستخدم';
      totals[u] = (totals[u] || 0) + e.amount;
    });
    return Object.entries(totals).sort((a, b) => b[1] - a[1]);
  }, [clientExpenses]);

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={`المصروفات (${clientExpenses.length})`}
      subtitle={client?.name}
      headerAction={<AddHeaderButton onClick={onAdd} label="جديد" />}
      headerExtras={<PdfBar onDownload={onDownloadPdf} onShare={onSharePdf} loading={pdfLoading} />}
      maxWidth="lg"
    >
      <div className="p-4 space-y-3">
        {/* Fund banners */}
        {globalFundStats && (
          <FundBanner title="رصيد العهدة العام المتاح" stats={globalFundStats} />
        )}
        {currentUserBalanceInfo && (
          <UserBalanceBanner info={currentUserBalanceInfo} userName={userName} />
        )}

        {/* Search */}
        <Input
          leftIcon={<Search sx={{ fontSize: 18 }} />}
          placeholder="ابحث في المصروفات..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {/* List */}
        {filtered.length === 0 ? (
          <EmptyState
            Icon={TrendingDown}
            title="لا توجد مصروفات"
            sub={search ? 'لا نتائج مطابقة' : 'أضف أول مصروف'}
          />
        ) : (
          <div className="space-y-2">
            {filtered.map((exp: Expense) => (
              <div
                key={exp.id}
                className="bg-surface-panel border border-border rounded-xl p-4 content-auto"
                style={{ borderInlineEndWidth: 3, borderInlineEndColor: 'var(--brand-danger)' }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm text-fg truncate">{exp.description}</div>
                    <div className="flex flex-wrap gap-1.5 items-center mt-1.5">
                      <span className="inline-flex items-center h-5 px-2 rounded-full bg-surface-sunken text-2xs font-bold text-fg-subtle border border-border">
                        {getExpenseCategoryLabel(exp.category)}
                      </span>
                      <span className="inline-flex items-center gap-1 text-2xs text-fg-muted">
                        <CalendarToday sx={{ fontSize: 11 }} /> {formatDate(exp.date)}
                      </span>
                      {exp.invoiceNumber && (
                        <span className="inline-flex items-center gap-1 text-2xs text-fg-muted">
                          <Description sx={{ fontSize: 11 }} /> {exp.invoiceNumber}
                        </span>
                      )}
                    </div>
                    {exp.createdBy && (
                      <div className="text-[0.65rem] text-fg-muted mt-1">بواسطة: {exp.createdBy}</div>
                    )}
                    {exp.notes && (
                      <div className="text-2xs text-fg-muted mt-1 line-clamp-2">{exp.notes}</div>
                    )}
                  </div>
                  <div className="text-start shrink-0 flex flex-col items-end gap-1">
                    <div className="font-extrabold text-base font-num tabular" style={{ color: 'var(--brand-danger)' }}>
                      {formatCurrency(exp.amount)}
                    </div>
                    <div className="flex gap-0.5">
                      <button
                        onClick={() => onEdit(exp)}
                        aria-label="تعديل"
                        className="h-7 w-7 rounded-md hover:bg-surface-sunken text-fg-muted hover:text-[color:var(--brand-primary)] transition-colors flex items-center justify-center"
                      >
                        <Edit sx={{ fontSize: 14 }} />
                      </button>
                      <button
                        onClick={() => onDelete(exp.id)}
                        aria-label="حذف"
                        className="h-7 w-7 rounded-md hover:bg-surface-sunken text-fg-muted hover:text-[color:var(--brand-danger)] transition-colors flex items-center justify-center"
                      >
                        <Delete sx={{ fontSize: 14 }} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Total + per-user breakdown */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #4C1D95 0%, #6D28D9 100%)',
            color: '#fff',
          }}
        >
          <button
            onClick={() => setExpandedBreakdown((v) => !v)}
            className="w-full flex items-center justify-between p-4 text-start"
          >
            <div className="flex items-center gap-2">
              <span className="font-extrabold">إجمالي المصروفات</span>
              {expandedBreakdown ? <ExpandLess sx={{ fontSize: 20 }} /> : <ExpandMore sx={{ fontSize: 20 }} />}
            </div>
            <span className="font-extrabold text-xl font-num tabular">
              {formatCurrency(summary.totalExpenses)}
            </span>
          </button>
          {expandedBreakdown && byUser.length > 0 && (
            <div className="p-4 pt-0 space-y-2 border-t border-white/10">
              <div className="text-2xs text-white/70 font-bold tracking-wider mt-3 mb-2">
                التوزيع حسب المستخدم
              </div>
              {byUser.map(([name, total]) => {
                const pct = summary.totalExpenses > 0 ? (total / summary.totalExpenses) * 100 : 0;
                return (
                  <div key={name} className="bg-white/8 rounded-lg p-2.5">
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="h-7 w-7 rounded-md bg-white/15 flex items-center justify-center text-sm font-bold shrink-0">
                          {name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold truncate">{name}</div>
                          <div className="text-[0.6rem] text-white/60">{pct.toFixed(1)}%</div>
                        </div>
                      </div>
                      <div className="text-sm font-extrabold font-num tabular">
                        {formatCurrency(total)}
                      </div>
                    </div>
                    <div className="h-1 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-[width] duration-base"
                        style={{
                          width: `${pct}%`,
                          background: 'linear-gradient(90deg, #F59E0B, #FBBF24)',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Sheet>
  );
}

function FundBanner({ title, stats }: any) {
  const positive = stats.remaining > 0;
  return (
    <div
      className="flex items-center justify-between rounded-xl px-4 py-3 border"
      style={{
        background: positive
          ? 'color-mix(in srgb, var(--brand-success) 10%, transparent)'
          : 'color-mix(in srgb, var(--brand-danger) 10%, transparent)',
        borderColor: positive
          ? 'color-mix(in srgb, var(--brand-success) 22%, transparent)'
          : 'color-mix(in srgb, var(--brand-danger) 22%, transparent)',
      }}
    >
      <div className="flex items-center gap-2">
        <AccountBalanceWallet
          sx={{ fontSize: 20 }}
          style={{ color: positive ? 'var(--brand-success)' : 'var(--brand-danger)' }}
        />
        <span className="text-xs font-bold text-fg-subtle">{title}</span>
      </div>
      <div
        className="font-extrabold text-base font-num tabular"
        style={{ color: positive ? 'var(--brand-success)' : 'var(--brand-danger)' }}
      >
        {formatCurrency(stats.remaining)}
      </div>
    </div>
  );
}

function UserBalanceBanner({ info, userName }: any) {
  const positive = info.remaining > 0;
  return (
    <div className="rounded-2xl overflow-hidden border"
      style={{ borderColor: positive ? 'color-mix(in srgb, var(--brand-success) 25%, transparent)' : 'color-mix(in srgb, var(--brand-danger) 25%, transparent)' }}
    >
      <div
        className="p-4 text-white"
        style={{
          background: positive
            ? 'linear-gradient(135deg, #059669 0%, #10B981 100%)'
            : 'linear-gradient(135deg, #E11D48 0%, #F43F5E 100%)',
        }}
      >
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <div className="text-2xs uppercase tracking-wider text-white/80 font-bold">
              رصيد عهدة — {userName}
            </div>
            <div className="text-2xl font-extrabold font-num tabular mt-1 leading-none">
              {formatCurrency(info.remaining)}
            </div>
          </div>
          <AccountBalanceWallet sx={{ fontSize: 36, opacity: 0.5 }} />
        </div>
      </div>
      <div className="grid grid-cols-2 bg-surface-panel">
        <div className="p-2.5 text-center border-l border-border rtl:border-l-0 rtl:border-r rtl:border-border">
          <div className="text-2xs text-fg-muted font-bold">إجمالي العهدة</div>
          <div className="text-sm font-extrabold font-num tabular mt-0.5" style={{ color: 'var(--brand-primary)' }}>
            {formatCurrency(info.given)}
          </div>
        </div>
        <div className="p-2.5 text-center">
          <div className="text-2xs text-fg-muted font-bold">المصروف</div>
          <div className="text-sm font-extrabold font-num tabular mt-0.5" style={{ color: 'var(--brand-danger)' }}>
            {formatCurrency(info.spent)}
          </div>
        </div>
      </div>
      {info.remaining <= 0 && info.given > 0 && (
        <div
          className="flex items-center gap-2 px-4 py-2 text-white text-xs font-bold"
          style={{ background: '#7F1D1D' }}
        >
          <WarningAmber sx={{ fontSize: 14 }} />
          تحذير: رصيد العهدة نفد بالكامل
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   PAYMENTS SHEET
═══════════════════════════════════════════════════════════════════════════ */

function PaymentsSheet({
  open, onClose, clientPayments, summary, pdfLoading, onAdd, onEdit, onDelete, onDownloadPdf, onSharePdf,
}: any) {
  const [search, setSearch] = useState('');
  const methodLabel: Record<string, string> = {
    cash: 'نقدي',
    bank_transfer: 'تحويل بنكي',
    check: 'شيك',
    credit_card: 'بطاقة',
    mobile_payment: 'محفظة',
  };
  const filtered = useMemo(() => {
    if (!search) return clientPayments;
    const q = search.toLowerCase();
    return clientPayments.filter(
      (p: PaymentType) =>
        formatCurrency(p.amount).includes(q) ||
        p.paymentMethod.includes(q) ||
        (p.notes || '').toLowerCase().includes(q)
    );
  }, [clientPayments, search]);

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={`المدفوعات (${clientPayments.length})`}
      subtitle={`إجمالي: ${formatCurrency(summary.totalPaid)}`}
      headerAction={<AddHeaderButton onClick={onAdd} label="دفعة" />}
      headerExtras={<PdfBar onDownload={onDownloadPdf} onShare={onSharePdf} loading={pdfLoading} />}
      maxWidth="lg"
    >
      <div className="p-4 space-y-3">
        <Input
          leftIcon={<Search sx={{ fontSize: 18 }} />}
          placeholder="ابحث في المدفوعات..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {filtered.length === 0 ? (
          <EmptyState Icon={Payment} title="لا توجد مدفوعات" sub="أضف أول دفعة" />
        ) : (
          <div className="space-y-2">
            {filtered.map((pay: PaymentType) => (
              <div
                key={pay.id}
                className="bg-surface-panel border border-border rounded-xl p-4 content-auto"
                style={{ borderInlineEndWidth: 3, borderInlineEndColor: 'var(--brand-success)' }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="font-extrabold text-base font-num tabular" style={{ color: 'var(--brand-success)' }}>
                      +{formatCurrency(pay.amount)}
                    </div>
                    <div className="flex flex-wrap gap-1.5 items-center mt-1.5">
                      <span
                        className="inline-flex items-center h-5 px-2 rounded-full text-2xs font-bold"
                        style={{ background: 'var(--brand-primary-soft)', color: 'var(--brand-primary)' }}
                      >
                        {methodLabel[pay.paymentMethod] || pay.paymentMethod}
                      </span>
                      <span className="inline-flex items-center gap-1 text-2xs text-fg-muted">
                        <CalendarToday sx={{ fontSize: 11 }} /> {formatDate(pay.paymentDate)}
                      </span>
                    </div>
                    {pay.createdBy && (
                      <div className="text-[0.65rem] text-fg-muted mt-1">بواسطة: {pay.createdBy}</div>
                    )}
                    {pay.notes && (
                      <div className="text-2xs text-fg-muted mt-1 line-clamp-2">{pay.notes}</div>
                    )}
                  </div>
                  <div className="flex flex-col gap-0.5 shrink-0">
                    <button
                      onClick={() => onEdit(pay)}
                      aria-label="تعديل"
                      className="h-7 w-7 rounded-md hover:bg-surface-sunken text-fg-muted hover:text-[color:var(--brand-primary)] transition-colors flex items-center justify-center"
                    >
                      <Edit sx={{ fontSize: 14 }} />
                    </button>
                    <button
                      onClick={() => onDelete(pay.id)}
                      aria-label="حذف"
                      className="h-7 w-7 rounded-md hover:bg-surface-sunken text-fg-muted hover:text-[color:var(--brand-danger)] transition-colors flex items-center justify-center"
                    >
                      <Delete sx={{ fontSize: 14 }} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div
          className="rounded-2xl p-4 flex items-center justify-between"
          style={{
            background: 'linear-gradient(135deg, #4C1D95 0%, #6D28D9 100%)',
            color: '#fff',
          }}
        >
          <span className="font-extrabold">إجمالي المحصّل</span>
          <span className="font-extrabold text-xl font-num tabular">{formatCurrency(summary.totalPaid)}</span>
        </div>
      </div>
    </Sheet>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   DEBTS SHEET
═══════════════════════════════════════════════════════════════════════════ */

function DebtsSheet({
  open, onClose, clientDebts, summary, pdfLoading, onAdd, onEdit, onDelete, onDownloadPdf, onSharePdf,
}: any) {
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={`الديون (${clientDebts.length})`}
      subtitle={`متبقي: ${formatCurrency(summary.totalDebts)}`}
      headerAction={<AddHeaderButton onClick={onAdd} label="دين" />}
      headerExtras={<PdfBar onDownload={onDownloadPdf} onShare={onSharePdf} loading={pdfLoading} />}
      maxWidth="lg"
    >
      <div className="p-4 space-y-2">
        {clientDebts.length === 0 ? (
          <EmptyState Icon={CreditCard} title="لا توجد ديون" sub="أضف أول دين" />
        ) : (
          clientDebts.map((d: StandaloneDebt) => {
            const pct = d.amount > 0 ? (d.paidAmount / d.amount) * 100 : 0;
            const isPaid = d.status === 'paid';
            return (
              <div key={d.id} className="bg-surface-panel border border-border rounded-xl p-4 content-auto">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    <div className="font-bold text-sm text-fg truncate">{d.partyName}</div>
                    <div className="text-2xs text-fg-muted truncate">{d.description}</div>
                  </div>
                  <span
                    className="inline-flex items-center h-6 px-2 rounded-full text-[0.65rem] font-bold shrink-0"
                    style={{
                      background: isPaid
                        ? 'color-mix(in srgb, var(--brand-success) 12%, transparent)'
                        : 'color-mix(in srgb, var(--brand-warning) 14%, transparent)',
                      color: isPaid ? 'var(--brand-success)' : 'var(--brand-warning)',
                    }}
                  >
                    {isPaid ? 'مسدد' : 'غير مسدد'}
                  </span>
                </div>

                <div className="rounded-lg bg-surface-sunken border border-border p-2.5 space-y-1 mb-2">
                  <div className="flex items-center justify-between text-2xs">
                    <span className="text-fg-muted">قيمة الدين</span>
                    <span className="font-bold text-fg font-num tabular">{formatCurrency(d.amount)}</span>
                  </div>
                  <div className="flex items-center justify-between text-2xs">
                    <span className="text-fg-muted">المدفوع</span>
                    <span className="font-bold font-num tabular" style={{ color: 'var(--brand-success)' }}>
                      {formatCurrency(d.paidAmount)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-2xs">
                    <span className="text-fg-muted">المتبقي</span>
                    <span className="font-extrabold font-num tabular" style={{ color: 'var(--brand-danger)' }}>
                      {formatCurrency(d.remainingAmount)}
                    </span>
                  </div>
                  <div className="h-1 rounded-full bg-black/5 overflow-hidden mt-1">
                    <div
                      className="h-full rounded-full transition-[width] duration-base"
                      style={{
                        width: `${Math.min(100, pct)}%`,
                        background: isPaid ? 'var(--brand-success)' : 'var(--brand-primary)',
                      }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 text-2xs text-fg-muted">
                    <CalendarToday sx={{ fontSize: 11 }} /> {formatDate(d.date)}
                  </span>
                  <div className="flex gap-0.5">
                    <button
                      onClick={() => onEdit(d)}
                      aria-label="تعديل"
                      className="h-7 w-7 rounded-md hover:bg-surface-sunken text-fg-muted hover:text-[color:var(--brand-primary)] transition-colors flex items-center justify-center"
                    >
                      <Edit sx={{ fontSize: 14 }} />
                    </button>
                    <button
                      onClick={() => onDelete(d.id)}
                      aria-label="حذف"
                      className="h-7 w-7 rounded-md hover:bg-surface-sunken text-fg-muted hover:text-[color:var(--brand-danger)] transition-colors flex items-center justify-center"
                    >
                      <Delete sx={{ fontSize: 14 }} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </Sheet>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   WORKERS SHEET
═══════════════════════════════════════════════════════════════════════════ */

function WorkersSheet({
  open, onClose, clientWorkers, summary, pdfLoading, onAdd, onEdit, onDelete, onPay, onDownloadPdf, onSharePdf,
}: any) {
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={`سجل العمال (${clientWorkers.length})`}
      subtitle={`متبقي: ${formatCurrency(summary.totalWorkersDue)}`}
      headerAction={<AddHeaderButton onClick={onAdd} label="عامل" />}
      headerExtras={
        <div className="space-y-2">
          {clientWorkers.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'الاتفاق', val: summary.totalWorkersAgreed, color: '#FBBF24' },
                { label: 'المدفوع', val: summary.totalWorkersPaid, color: '#6EE7B7' },
                { label: 'المتبقي', val: summary.totalWorkersDue, color: '#FCA5A5' },
              ].map((s, i) => (
                <div key={i} className="text-center bg-white/8 rounded-lg py-2 border border-white/10">
                  <div className="text-[0.6rem] text-white/60 font-semibold">{s.label}</div>
                  <div className="text-xs font-extrabold mt-0.5 font-num tabular truncate" style={{ color: s.color }}>
                    {formatCurrency(s.val)}
                  </div>
                </div>
              ))}
            </div>
          )}
          <PdfBar onDownload={onDownloadPdf} onShare={onSharePdf} loading={pdfLoading} />
        </div>
      }
      maxWidth="lg"
    >
      <div className="p-4 space-y-2">
        {clientWorkers.length === 0 ? (
          <EmptyState Icon={PersonAdd} title="لا يوجد عمال بعد" sub="أضف أول عامل / مقاول" />
        ) : (
          clientWorkers.map((w: any) => {
            const pct = w.totalAmount > 0 ? Math.min(100, (w.paidAmount / w.totalAmount) * 100) : 0;
            const done = w.remainingAmount <= 0;
            const accent = done ? 'var(--brand-success)' : '#D97706';
            return (
              <div key={w.id} className="bg-surface-panel border border-border rounded-2xl overflow-hidden content-auto">
                <div className="h-1" style={{ background: accent }} />
                <div className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="h-12 w-12 rounded-xl flex items-center justify-center shrink-0 text-lg font-extrabold"
                      style={{
                        background: done
                          ? 'color-mix(in srgb, var(--brand-success) 15%, transparent)'
                          : 'color-mix(in srgb, #F59E0B 15%, transparent)',
                        color: accent,
                      }}
                    >
                      {w.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm text-fg truncate">{w.name}</div>
                      <div className="text-2xs text-fg-muted" style={{ color: 'var(--brand-primary)' }}>
                        {w.jobType || 'عامل / مقاول'}
                      </div>
                    </div>
                    <span
                      className="inline-flex items-center gap-1 h-6 px-2 rounded-full text-[0.65rem] font-bold"
                      style={{
                        background: done
                          ? 'color-mix(in srgb, var(--brand-success) 12%, transparent)'
                          : 'color-mix(in srgb, var(--brand-warning) 14%, transparent)',
                        color: accent,
                      }}
                    >
                      {done ? <CheckCircle sx={{ fontSize: 11 }} /> : null}
                      {done ? 'مكتمل' : 'جارٍ'}
                    </span>
                  </div>

                  <div className="mb-2.5">
                    <div className="flex items-center justify-between text-[0.65rem] font-bold mb-1">
                      <span className="text-fg-muted">نسبة الإنجاز</span>
                      <span style={{ color: accent }}>{Math.round(pct)}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-surface-sunken overflow-hidden">
                      <div
                        className="h-full rounded-full transition-[width] duration-base"
                        style={{ width: `${pct}%`, background: accent }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 rounded-lg bg-surface-sunken overflow-hidden mb-2">
                    {[
                      { label: 'الاتفاق', val: w.totalAmount, color: 'var(--text-primary)' },
                      { label: 'المدفوع', val: w.paidAmount, color: 'var(--brand-success)' },
                      { label: 'المتبقي', val: w.remainingAmount, color: w.remainingAmount > 0 ? 'var(--brand-danger)' : 'var(--brand-success)' },
                    ].map((s, i) => (
                      <div
                        key={i}
                        className="p-2 text-center"
                        style={{ borderInlineStart: i > 0 ? '1px solid var(--surface-border)' : undefined }}
                      >
                        <div className="text-[0.6rem] text-fg-muted font-bold">{s.label}</div>
                        <div className="text-xs font-extrabold font-num tabular mt-0.5 truncate" style={{ color: s.color }}>
                          {formatCurrency(s.val)}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <Button size="sm" block leftIcon={<Payment sx={{ fontSize: 14 }} />} onClick={() => onPay(w)}>
                      صرف دفعة
                    </Button>
                    <button
                      onClick={() => onEdit(w)}
                      aria-label="تعديل"
                      className="h-9 w-9 rounded-md bg-surface-sunken hover:bg-[color:var(--brand-primary-soft)] text-fg-muted hover:text-[color:var(--brand-primary)] transition-colors flex items-center justify-center"
                    >
                      <Edit sx={{ fontSize: 16 }} />
                    </button>
                    <button
                      onClick={() => onDelete(w.id)}
                      aria-label="حذف"
                      className="h-9 w-9 rounded-md bg-surface-sunken hover:bg-[color:color-mix(in_srgb,var(--brand-danger)_10%,transparent)] text-fg-muted hover:text-[color:var(--brand-danger)] transition-colors flex items-center justify-center"
                    >
                      <Delete sx={{ fontSize: 16 }} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </Sheet>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   BALANCES SHEET
═══════════════════════════════════════════════════════════════════════════ */

function BalancesSheet({
  open, onClose, clientUserBalances, userBalancesSummary, onAdd, onEdit, onDelete,
}: any) {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="أرصدة العميل (العهد)"
      subtitle={`${clientUserBalances.length} حركة`}
      headerAction={<AddHeaderButton onClick={onAdd} label="عهدة" />}
      maxWidth="lg"
    >
      <div className="p-4 space-y-4">
        {/* Per-user summary */}
        {Object.entries(userBalancesSummary).length > 0 && (
          <section className="space-y-3">
            <h3 className="text-sm font-bold text-fg flex items-center gap-2">
              <TrendingUp sx={{ fontSize: 18, color: 'var(--brand-primary)' }} />
              ملخص حسب المستخدم
            </h3>
            <div className="grid grid-cols-1 gap-3">
              {Object.entries(userBalancesSummary).map(([uid, sum]: any) => (
                <div key={uid} className="bg-surface-panel border border-border rounded-2xl overflow-hidden">
                  <div
                    className="h-1"
                    style={{
                      background: sum.remaining > 0 ? 'var(--brand-primary)' : 'var(--brand-danger)',
                    }}
                  />
                  <div className="p-4">
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="h-11 w-11 rounded-xl flex items-center justify-center shrink-0 text-base font-extrabold"
                          style={{
                            background: 'var(--brand-primary-soft)',
                            color: 'var(--brand-primary)',
                          }}
                        >
                          {sum.name?.charAt(0) || 'م'}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-sm text-fg truncate">{sum.name}</div>
                          <div className="text-2xs text-fg-muted truncate">مكلف بالعهد</div>
                        </div>
                      </div>
                      <div
                        className="text-start px-3 py-1.5 rounded-lg border shrink-0"
                        style={{
                          background: sum.remaining > 0 ? 'var(--brand-primary-soft)' : 'color-mix(in srgb, var(--brand-danger) 10%, transparent)',
                          borderColor: sum.remaining > 0 ? 'color-mix(in srgb, var(--brand-primary) 18%, transparent)' : 'color-mix(in srgb, var(--brand-danger) 22%, transparent)',
                        }}
                      >
                        <div className="text-[0.6rem] font-bold" style={{ color: sum.remaining > 0 ? 'var(--brand-primary)' : 'var(--brand-danger)' }}>
                          الرصيد
                        </div>
                        <div className="text-sm font-extrabold font-num tabular" style={{ color: sum.remaining > 0 ? 'var(--brand-primary)' : 'var(--brand-danger)' }}>
                          {formatCurrency(sum.remaining)}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 rounded-lg bg-surface-sunken overflow-hidden">
                      <div className="p-2 text-center border-l border-border rtl:border-l-0 rtl:border-r rtl:border-border">
                        <div className="text-[0.6rem] text-fg-muted font-bold">إجمالي العهدة</div>
                        <div className="text-xs font-extrabold font-num tabular mt-0.5" style={{ color: 'var(--brand-primary)' }}>
                          {formatCurrency(sum.given)}
                        </div>
                      </div>
                      <div className="p-2 text-center">
                        <div className="text-[0.6rem] text-fg-muted font-bold">المصروف</div>
                        <div className="text-xs font-extrabold font-num tabular mt-0.5" style={{ color: 'var(--brand-danger)' }}>
                          {formatCurrency(sum.spent)}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => setExpanded(expanded === uid ? null : uid)}
                      className="w-full mt-2 h-8 rounded-md text-xs font-bold flex items-center justify-center gap-1 transition-colors"
                      style={{
                        color: 'var(--brand-primary)',
                        background: expanded === uid ? 'var(--brand-primary-soft)' : 'transparent',
                      }}
                    >
                      {expanded === uid ? 'إخفاء سجل المصروفات' : `مراجعة المصروفات (${sum.expenses?.length || 0})`}
                      {expanded === uid ? <ExpandLess sx={{ fontSize: 16 }} /> : <ExpandMore sx={{ fontSize: 16 }} />}
                    </button>

                    {expanded === uid && (
                      <div className="mt-2 pt-2 border-t border-dashed border-border space-y-1.5">
                        {sum.expenses?.length === 0 ? (
                          <div className="text-xs text-fg-muted text-center py-2">
                            لم يسجّل هذا المستخدم أي مصروفات.
                          </div>
                        ) : (
                          sum.expenses?.map((e: Expense) => (
                            <div key={e.id} className="flex items-center justify-between bg-surface-sunken rounded-lg p-2">
                              <div className="min-w-0">
                                <div className="text-xs font-bold text-fg truncate">{e.description}</div>
                                <div className="text-[0.65rem] text-fg-muted">
                                  {formatDate(e.date)} · {getExpenseCategoryLabel(e.category)}
                                </div>
                              </div>
                              <div className="text-xs font-extrabold font-num tabular" style={{ color: 'var(--brand-danger)' }}>
                                -{formatCurrency(e.amount)}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Transaction log */}
        <section className="space-y-3">
          <h3 className="text-sm font-bold text-fg flex items-center gap-2">
            <AccountBalanceWallet sx={{ fontSize: 18, color: 'var(--brand-primary)' }} />
            سجل الحركات
          </h3>
          {clientUserBalances.length === 0 ? (
            <EmptyState Icon={AccountBalanceWallet} title="لا توجد حركات" sub="أضف أول رصيد عهدة للمستخدمين" />
          ) : (
            <div className="space-y-2">
              {clientUserBalances.map((bal: UserBalance, idx: number) => (
                <div key={bal.id} className="bg-surface-panel border border-border rounded-xl p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <span
                        className="inline-flex items-center h-6 px-2 rounded-md border text-[0.65rem] font-extrabold font-num tabular shrink-0"
                        style={{
                          background: 'var(--brand-primary-soft)',
                          borderColor: 'color-mix(in srgb, var(--brand-primary) 20%, transparent)',
                          color: 'var(--brand-primary)',
                        }}
                      >
                        #{clientUserBalances.length - idx}
                      </span>
                      <div
                        className="h-8 w-8 rounded-md flex items-center justify-center shrink-0"
                        style={{ background: 'var(--surface-sunken)', color: 'var(--brand-primary)' }}
                      >
                        <Person sx={{ fontSize: 16 }} />
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-sm text-fg truncate">{bal.userName}</div>
                        <div className="flex flex-wrap gap-1.5 items-center mt-1">
                          <span
                            className="inline-flex items-center h-5 px-2 rounded-full text-[0.65rem] font-bold font-num tabular"
                            style={{ background: 'var(--brand-primary-soft)', color: 'var(--brand-primary)' }}
                          >
                            + {formatCurrency(bal.amount)}
                          </span>
                          <span className="text-2xs text-fg-muted">{formatDate(bal.date)}</span>
                        </div>
                        {bal.notes && (
                          <div
                            className="text-2xs mt-1.5 p-2 rounded-md border font-medium line-clamp-2"
                            style={{
                              background: 'color-mix(in srgb, #F59E0B 10%, transparent)',
                              borderColor: 'color-mix(in srgb, #F59E0B 20%, transparent)',
                              color: '#92400E',
                            }}
                          >
                            {bal.notes}
                          </div>
                        )}
                        {bal.createdBy && (
                          <div className="text-[0.65rem] text-fg-muted mt-1">بواسطة: {bal.createdBy}</div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-0.5 shrink-0">
                      <button
                        onClick={() => onEdit(bal)}
                        aria-label="تعديل"
                        className="h-7 w-7 rounded-md hover:bg-surface-sunken text-fg-muted hover:text-[color:var(--brand-primary)] transition-colors flex items-center justify-center"
                      >
                        <Edit sx={{ fontSize: 14 }} />
                      </button>
                      <button
                        onClick={() => onDelete(bal.id)}
                        aria-label="حذف"
                        className="h-7 w-7 rounded-md hover:bg-surface-sunken text-fg-muted hover:text-[color:var(--brand-danger)] transition-colors flex items-center justify-center"
                      >
                        <Delete sx={{ fontSize: 14 }} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </Sheet>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   FORM SHEETS (add / edit)
═══════════════════════════════════════════════════════════════════════════ */

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold text-fg-subtle">{label}</span>
      {children}
    </label>
  );
}

function Select({ value, onChange, children, ...rest }: any) {
  return (
    <select
      value={value}
      onChange={onChange}
      {...rest}
      className="h-10 px-3 rounded-md bg-surface-raised border border-border text-sm text-fg outline-none focus:border-[color:var(--brand-primary)] focus:shadow-focus"
    >
      {children}
    </select>
  );
}

function TextArea({ rows = 2, ...rest }: any) {
  return (
    <textarea
      rows={rows}
      {...rest}
      className="px-3 py-2 rounded-md bg-surface-raised border border-border text-sm text-fg outline-none focus:border-[color:var(--brand-primary)] focus:shadow-focus resize-none"
    />
  );
}

function PaymentFormSheet({ edit, onClose, onSubmit }: any) {
  const { control, handleSubmit } = useForm({
    defaultValues: {
      amount: edit?.amount ?? ('' as any),
      paymentMethod: edit?.paymentMethod ?? 'cash',
      paymentDate: edit?.paymentDate ?? dayjs().format('YYYY-MM-DD'),
      invoiceId: edit?.invoiceId ?? '',
      notes: edit?.notes ?? '',
    },
  });

  return (
    <Sheet
      open
      onClose={onClose}
      title={edit ? 'تعديل دفعة' : 'إضافة دفعة'}
      subtitle="بيانات الدفعة"
      maxWidth="md"
      footer={
        <div className="flex gap-2">
          <Button variant="outline" block onClick={onClose}>إلغاء</Button>
          <Button block onClick={handleSubmit(onSubmit)}>{edit ? 'حفظ' : 'إضافة'}</Button>
        </div>
      }
    >
      <div className="p-4 space-y-3">
        <Controller
          name="amount"
          control={control}
          render={({ field }) => (
            <Input
              {...field}
              label="المبلغ"
              type="number"
              inputMode="decimal"
              placeholder="0.00"
              rightIcon={<span className="text-2xs font-semibold">د.ل</span>}
            />
          )}
        />
        <Controller
          name="paymentMethod"
          control={control}
          render={({ field }) => (
            <FormField label="طريقة الدفع">
              <Select {...field}>
                <option value="cash">نقدي</option>
                <option value="bank_transfer">تحويل بنكي</option>
                <option value="check">شيك</option>
                <option value="credit_card">بطاقة</option>
              </Select>
            </FormField>
          )}
        />
        <Controller
          name="paymentDate"
          control={control}
          render={({ field }) => (
            <FormField label="تاريخ الدفعة">
              <input
                type="date"
                {...field}
                className="h-10 px-3 rounded-md bg-surface-raised border border-border text-sm text-fg outline-none focus:border-[color:var(--brand-primary)] focus:shadow-focus"
              />
            </FormField>
          )}
        />
        <Controller
          name="notes"
          control={control}
          render={({ field }) => (
            <FormField label="ملاحظات (اختياري)">
              <TextArea {...field} />
            </FormField>
          )}
        />
      </div>
    </Sheet>
  );
}

function ExpenseFormSheet({
  edit, presetWorker, clientWorkers, currentUserBalanceInfo, userName, onClose, onSubmit,
}: any) {
  const { control, handleSubmit } = useForm({
    defaultValues: {
      description: edit?.description ?? (presetWorker ? `دفعة حساب: ${presetWorker.name}` : ''),
      amount: edit?.amount ?? ('' as any),
      category: edit?.category ?? (presetWorker ? 'labor' : 'materials'),
      date: edit?.date ?? dayjs().format('YYYY-MM-DD'),
      invoiceNumber: edit?.invoiceNumber ?? '',
      notes: edit?.notes ?? '',
      workerId: edit?.workerId ?? presetWorker?.id ?? '',
    },
  });

  return (
    <Sheet
      open
      onClose={onClose}
      title={edit ? 'تعديل مصروف' : 'إضافة مصروف'}
      subtitle="بيانات المصروف"
      maxWidth="md"
      footer={
        <div className="flex gap-2">
          <Button variant="outline" block onClick={onClose}>إلغاء</Button>
          <Button block onClick={handleSubmit(onSubmit)}>{edit ? 'حفظ' : 'حفظ وإصدار'}</Button>
        </div>
      }
    >
      <div className="p-4 space-y-3">
        {currentUserBalanceInfo && (
          <UserBalanceBanner info={currentUserBalanceInfo} userName={userName} />
        )}
        <Controller name="description" control={control} render={({ field }) => (
          <Input {...field} label="الوصف" placeholder="مثال: شراء مواد" leftIcon={<NoteAlt sx={{ fontSize: 16 }} />} />
        )} />
        <Controller name="amount" control={control} render={({ field }) => (
          <Input {...field} label="المبلغ" type="number" inputMode="decimal" placeholder="0.00"
            rightIcon={<span className="text-2xs font-semibold">د.ل</span>} />
        )} />
        <div className="grid grid-cols-2 gap-3">
          <Controller name="category" control={control} render={({ field }) => (
            <FormField label="التصنيف">
              <Select {...field}>
                {Object.entries(expenseCategories).map(([k, l]) => (
                  <option key={k} value={k}>{l}</option>
                ))}
              </Select>
            </FormField>
          )} />
          <Controller name="workerId" control={control} render={({ field }) => (
            <FormField label="العامل (اختياري)">
              <Select {...field}>
                <option value="">لا يوجد</option>
                {clientWorkers.map((w: Worker) => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </Select>
            </FormField>
          )} />
        </div>
        <Controller name="invoiceNumber" control={control} render={({ field }) => (
          <Input {...field} label="رقم الفاتورة (اختياري)" />
        )} />
        <Controller name="date" control={control} render={({ field }) => (
          <FormField label="تاريخ المصروف">
            <input type="date" {...field}
              className="h-10 px-3 rounded-md bg-surface-raised border border-border text-sm text-fg outline-none focus:border-[color:var(--brand-primary)] focus:shadow-focus" />
          </FormField>
        )} />
        <Controller name="notes" control={control} render={({ field }) => (
          <FormField label="ملاحظات"><TextArea {...field} /></FormField>
        )} />
      </div>
    </Sheet>
  );
}

function DebtFormSheet({ edit, onClose, onSubmit }: any) {
  const { control, handleSubmit } = useForm({
    defaultValues: {
      partyName: edit?.partyName ?? '',
      description: edit?.description ?? '',
      amount: edit?.amount ?? ('' as any),
      date: edit?.date ?? dayjs().format('YYYY-MM-DD'),
      notes: edit?.notes ?? '',
    },
  });

  return (
    <Sheet
      open
      onClose={onClose}
      title={edit ? 'تعديل دين' : 'إضافة دين'}
      subtitle="بيانات الدين"
      maxWidth="md"
      footer={
        <div className="flex gap-2">
          <Button variant="outline" block onClick={onClose}>إلغاء</Button>
          <Button block onClick={handleSubmit(onSubmit)}>{edit ? 'حفظ' : 'إضافة'}</Button>
        </div>
      }
    >
      <div className="p-4 space-y-3">
        <Controller name="partyName" control={control} render={({ field }) => (
          <Input {...field} label="اسم الطرف" placeholder="الشخص أو الجهة" />
        )} />
        <Controller name="description" control={control} render={({ field }) => (
          <Input {...field} label="وصف الدين" />
        )} />
        <Controller name="amount" control={control} render={({ field }) => (
          <Input {...field} label="المبلغ" type="number" inputMode="decimal" placeholder="0.00"
            rightIcon={<span className="text-2xs font-semibold">د.ل</span>} />
        )} />
        <Controller name="date" control={control} render={({ field }) => (
          <FormField label="تاريخ الدين">
            <input type="date" {...field}
              className="h-10 px-3 rounded-md bg-surface-raised border border-border text-sm text-fg outline-none focus:border-[color:var(--brand-primary)] focus:shadow-focus" />
          </FormField>
        )} />
        <Controller name="notes" control={control} render={({ field }) => (
          <FormField label="ملاحظات"><TextArea {...field} /></FormField>
        )} />
      </div>
    </Sheet>
  );
}

function WorkerFormSheet({ edit, onClose, onSubmit }: any) {
  const { control, handleSubmit } = useForm({
    resolver: zodResolver(workerSchema),
    defaultValues: {
      name: edit?.name ?? '',
      jobType: edit?.jobType ?? '',
      totalAmount: edit?.totalAmount ?? ('' as any),
    },
  });

  return (
    <Sheet
      open
      onClose={onClose}
      title={edit ? 'تعديل عامل' : 'إضافة عامل'}
      subtitle="بيانات العامل / المقاول"
      maxWidth="md"
      footer={
        <div className="flex gap-2">
          <Button variant="outline" block onClick={onClose}>إلغاء</Button>
          <Button block onClick={handleSubmit(onSubmit)}>{edit ? 'حفظ' : 'إضافة'}</Button>
        </div>
      }
    >
      <div className="p-4 space-y-3">
        <Controller name="name" control={control} render={({ field }) => (
          <Input {...field} label="اسم العامل" placeholder="الاسم الكامل" leftIcon={<Person sx={{ fontSize: 16 }} />} />
        )} />
        <Controller name="jobType" control={control} render={({ field }) => (
          <Input {...field} label="طبيعة العمل" placeholder="بياض، كهرباء، مقاول..." leftIcon={<Business sx={{ fontSize: 16 }} />} />
        )} />
        <Controller name="totalAmount" control={control} render={({ field }) => (
          <Input {...field} label="المبلغ المتفق عليه" type="number" inputMode="decimal" placeholder="0.00"
            leftIcon={<AccountBalanceWallet sx={{ fontSize: 16 }} />}
            rightIcon={<span className="text-2xs font-semibold">د.ل</span>} />
        )} />
      </div>
    </Sheet>
  );
}

function BalanceFormSheet({ edit, systemUsers, onClose, onSubmit }: any) {
  const { control, handleSubmit } = useForm({
    defaultValues: {
      userId: edit?.userId ?? '',
      amount: edit?.amount ?? ('' as any),
      date: edit?.date ?? dayjs().format('YYYY-MM-DD'),
      notes: edit?.notes ?? '',
    },
  });

  return (
    <Sheet
      open
      onClose={onClose}
      title={edit ? 'تعديل العهدة' : 'إيداع عهدة'}
      subtitle="تفاصيل الدفعة المالية"
      maxWidth="md"
      footer={
        <div className="flex gap-2">
          <Button variant="outline" block onClick={onClose}>إلغاء</Button>
          <Button block onClick={handleSubmit(onSubmit)}>{edit ? 'حفظ' : 'إيداع'}</Button>
        </div>
      }
    >
      <div className="p-4 space-y-3">
        <Controller name="userId" control={control} render={({ field }) => (
          <FormField label="الموظف / المستلم">
            <Select {...field}>
              <option value="">اختر الموظف</option>
              {systemUsers.map((u: any) => (
                <option key={u.id} value={u.uid || u.id}>{u.displayName}</option>
              ))}
            </Select>
          </FormField>
        )} />
        <Controller name="amount" control={control} render={({ field }) => (
          <Input {...field} label="مبلغ العهدة" type="number" inputMode="decimal" placeholder="0.00"
            leftIcon={<AccountBalanceWallet sx={{ fontSize: 16 }} />}
            rightIcon={<span className="text-2xs font-semibold">د.ل</span>} />
        )} />
        <Controller name="date" control={control} render={({ field }) => (
          <FormField label="تاريخ الإضافة">
            <input type="date" {...field}
              className="h-10 px-3 rounded-md bg-surface-raised border border-border text-sm text-fg outline-none focus:border-[color:var(--brand-primary)] focus:shadow-focus" />
          </FormField>
        )} />
        <Controller name="notes" control={control} render={({ field }) => (
          <FormField label="ملاحظات (اختياري)"><TextArea {...field} rows={3} /></FormField>
        )} />
      </div>
    </Sheet>
  );
}

function EditClientFormSheet({ client, onClose, onSubmit, onDelete }: any) {
  const { control, handleSubmit } = useForm({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: client.name,
      email: client.email || '',
      phone: client.phone,
      address: client.address,
      type: client.type,
    },
  });

  return (
    <Sheet
      open
      onClose={onClose}
      title="تعديل العميل"
      subtitle={client.name}
      maxWidth="md"
      footer={
        <div className="space-y-2">
          <div className="flex gap-2">
            <Button variant="outline" block onClick={onClose}>إلغاء</Button>
            <Button block onClick={handleSubmit(onSubmit)}>حفظ التعديلات</Button>
          </div>
          <Button variant="danger" block leftIcon={<Delete sx={{ fontSize: 16 }} />} onClick={onDelete}>
            حذف العميل وكل بياناته
          </Button>
        </div>
      }
    >
      <div className="p-4 space-y-3">
        <Controller name="name" control={control} render={({ field }) => (
          <Input {...field} label="اسم العميل" placeholder="الاسم الكامل" />
        )} />
        <Controller name="type" control={control} render={({ field }) => (
          <FormField label="النوع">
            <Select {...field}>
              <option value="individual">فرد</option>
              <option value="company">شركة</option>
            </Select>
          </FormField>
        )} />
        <Controller name="phone" control={control} render={({ field }) => (
          <Input {...field} label="رقم الهاتف" placeholder="091..." />
        )} />
        <Controller name="email" control={control} render={({ field }) => (
          <Input {...field} label="البريد الإلكتروني (اختياري)" type="email" />
        )} />
        <Controller name="address" control={control} render={({ field }) => (
          <FormField label="العنوان"><TextArea {...field} rows={2} /></FormField>
        )} />
      </div>
    </Sheet>
  );
}
