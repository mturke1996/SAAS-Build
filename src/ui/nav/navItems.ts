import {
  Home,
  People,
  Receipt,
  Payments as PaymentsIcon,
  AccountBalance,
  Description,
  ManageAccounts,
  Savings,
  ReceiptLong,
  Settings,
  AddCircleOutline,
} from '@mui/icons-material';
import { ComponentType } from 'react';

export interface NavItem {
  label: string;         // Arabic (default direction=rtl)
  labelEn: string;       // English fallback when direction=ltr
  path: string;
  icon: ComponentType<any>;
  /** AppLockGuard module key (null = always visible). */
  module: string | null;
  /** Shown in the bottom mobile bar (keep it ≤ 5 items). */
  mobile?: boolean;
}

/** Mobile bottom bar — primary 5 destinations. */
export const PRIMARY_NAV: NavItem[] = [
  { label: 'الرئيسية', labelEn: 'Home',     path: '/',         icon: Home,           module: null,      mobile: true },
  { label: 'العملاء',  labelEn: 'Clients',  path: '/clients',  icon: People,         module: 'clients', mobile: true },
  { label: 'الفواتير', labelEn: 'Invoices', path: '/invoices', icon: Receipt,        module: 'invoices',mobile: true },
  { label: 'المدفوعات',labelEn: 'Payments', path: '/payments', icon: PaymentsIcon,   module: 'payments',mobile: true },
  { label: 'العهدات',  labelEn: 'Fund',     path: '/fund',     icon: AccountBalance, module: 'balances',mobile: true },
];

/** Additional destinations — shown in sidebar (desktop) and drawer (mobile). */
export const SECONDARY_NAV: NavItem[] = [
  { label: 'فاتورة جديدة', labelEn: 'New Invoice', path: '/invoices/new', icon: AddCircleOutline, module: 'invoices' },
  { label: 'الديون',       labelEn: 'Debts',       path: '/debts',       icon: Savings,          module: 'debts' },
  { label: 'المصروفات',    labelEn: 'Expenses',    path: '/expenses',    icon: ReceiptLong,      module: 'expenses' },
  { label: 'الرسائل',      labelEn: 'Letters',     path: '/letters',     icon: Description,      module: 'letters' },
  { label: 'المستخدمين',   labelEn: 'Users',       path: '/users',       icon: ManageAccounts,   module: 'users' },
  { label: 'الإعدادات',    labelEn: 'Settings',    path: '/settings/branding', icon: Settings,   module: null },
];

/**
 * Desktop sidebar: one logical order with every screen (no duplicate sections).
 * Flow: overview → people → sales → cashflow → custody → admin.
 */
export const SIDEBAR_NAV: NavItem[] = [
  PRIMARY_NAV[0],
  PRIMARY_NAV[1],
  PRIMARY_NAV[2],
  SECONDARY_NAV[0],
  PRIMARY_NAV[3],
  SECONDARY_NAV[2],
  PRIMARY_NAV[4],
  SECONDARY_NAV[1],
  SECONDARY_NAV[3],
  SECONDARY_NAV[4],
  SECONDARY_NAV[5],
];

/** Slice intervals [start, end) over `SIDEBAR_NAV` for desktop section headers. */
export const SIDEBAR_GROUP_SLICES: readonly { titleAr: string; titleEn: string; start: number; end: number }[] = [
  { titleAr: 'عام', titleEn: 'Overview', start: 0, end: 3 },
  { titleAr: 'المبيعات والمالية', titleEn: 'Sales & finance', start: 3, end: 8 },
  { titleAr: 'الإدارة والإعدادات', titleEn: 'Admin', start: 8, end: 11 },
] as const;

/** Utility — pick label for current direction. */
export function navLabel(item: NavItem, direction: 'rtl' | 'ltr'): string {
  return direction === 'rtl' ? item.label : item.labelEn;
}
