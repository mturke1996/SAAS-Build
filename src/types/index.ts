// User & Authentication Types
export interface User {
  id: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  role?: 'admin' | 'editor' | 'viewer';
}

// Client Types
export interface Client {
  id: string;
  name: string;
  // email removed per request, kept optional for compatibility if needed or removed from UI
  email?: string; 
  phone: string;
  address: string;
  type: 'company' | 'individual';
  profitPercentage?: number; // نسبة الأرباح من المصروفات
  createdAt: string;
  updatedAt: string;
  createdBy?: string; // اسم المستخدم الذي أضاف العميل
}

export interface Worker {
  id: string;
  clientId: string;
  name: string; // اسم العامل (مثلاً: كهرباء)
  jobType?: string; // نوع العمل
  totalAmount: number; // القيمة المتفق عليها (مثلاً: 4000)
  paidAmount: number; // المبلغ المدفوع للعامل حتى الآن
  remainingAmount: number; // المبلغ المتبقي للعامل
  status: 'active' | 'completed';
  createdAt: string;
  updatedAt: string;
}

// Invoice Types
export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  tempClientName?: string; // أسم العميل المؤقت (إذا لم يكن مسجل)
  tempClientPhone?: string; // هاتف العميل المؤقت
  tempClientAddress?: string; // عنوان العميل المؤقت
  items: InvoiceItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  status: 'draft' | 'sent' | 'paid' | 'partially_paid' | 'overdue' | 'cancelled';
  issueDate: string;
  dueDate: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string; // اسم المستخدم الذي أنشأ الفاتورة
}

// Payment Types
export interface Payment {
  id: string;
  invoiceId: string;
  clientId: string;
  amount: number;
  paymentMethod: 'cash' | 'check' | 'bank_transfer' | 'credit_card' | 'mobile_payment';
  paymentDate: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string; // اسم المستخدم الذي سجل الدفعة
}

// Expense Types
export const EXPENSE_CATEGORIES = [
  'materials', // مواد
  'labor', // عمالة
  'transport', // نقل ومواصلات
  'equipment', // معدات
  'subcontractors', // مقاولين باطن
  'hospitality', // ضيافة
  'rent', // إيجار
  'maintenance', // صيانة
  'marketing', // تسويق
  'utilities', // فواتير (كهرباء/ماء/نت)
  'government_fees', // رسوم حكومية
  'office_supplies', // قرطاسية ومكتبية
  'other', // أخرى
] as const;

export type ExpenseCategory = typeof EXPENSE_CATEGORIES[number];

export interface Expense {
  id: string;
  clientId: string;
  description: string;
  amount: number;
  category: ExpenseCategory;
  date: string;
  invoiceNumber?: string; // رقم الفاتورة (اختياري) - ميزة جديدة
  isClosed: boolean; // هل تم إغلاق المصروف في فاتورة مجمعة؟
  closedAt?: string; // تاريخ الإغلاق
  expenseInvoiceId?: string; // رقم فاتورة المصروفات المجمعة
  notes?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string; // اسم المستخدم الذي سجل المصروف
  userId?: string; // Firebase Auth UID للمستخدم الذي سجل المصروف (للربط بالعهدة)
  workerId?: string; // ربط المصروف بعامل إذا كان دفعة له
  workerName?: string;
}

// Standalone Debt Types (الديون)
export interface StandaloneDebt {
  id: string;
  clientId?: string; // دين على عميل (اختياري)
  partyId?: string; // أو دين على طرف خارجي
  partyType: 'client' | 'external';
  partyName: string; // اسم الطرف للمرونة
  description: string;
  amount: number; // قيمة الدين الكلية
  paidAmount: number; // المبلغ المدفوع حتى الأن
  remainingAmount: number; // المبلغ المتبقي
  status: 'unpaid' | 'partially_paid' | 'paid' | 'overdue';
  date: string; // تاريخ الدين
  dueDate?: string; // تاريخ الاستحقاق
  notes?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string; // اسم المستخدم الذي سجل الدين
}

export interface DebtParty {
  id: string;
  name: string;
  phone: string;
  address?: string;
  type: 'individual' | 'company';
  createdAt: string;
  updatedAt: string;
  clientId?: string; // ربط مبدئي مع عميل إذا وجد
}

// Expense Invoice Types (فواتير المصروفات المجمعة)
export interface ExpenseInvoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  expenseIds: string[]; // قائمة معرفات المصروفات المشمولة
  startDate: string;
  endDate: string;
  totalAmount: number;
  expenses: Expense[]; // (denormalized data for easier display)
  status: 'draft' | 'saved' | 'sent';
  issueDate: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string; // اسم المستخدم الذي أنشأ القائمة
}

// Dashboard Summary Types
export interface FinancialSummary {
  totalInvoiced: number; // إجمالي الفواتير
  totalCollected: number; // إجمالي المحصل
  totalExpenses: number; // إجمالي المصروفات
  netIncome: number; // صافي الدخل
  outstandingDebts: number; // ديون مستحقة لنا
  monthlyData: MonthlyData[];
}

export interface MonthlyData {
  month: number;
  year: number;
  invoiced: number;
  collected: number;
  expenses: number;
}

// User Balance Types (العهد و الأرصدة)
export interface UserBalance {
  id: string;
  clientId: string;
  userName: string;
  amount: number;
  date: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

// ═══════════════════════════════════════════════
// Global Fund Types (الصندوق المشترك)
// ═══════════════════════════════════════════════

/** نوع المعاملة في الصندوق */
export type FundTransactionType = 'deposit' | 'withdrawal';

/** سجل معاملة واحدة في الصندوق */
export interface GlobalFundTransaction {
  id: string;
  type: FundTransactionType;   // إيداع أو سحب
  amount: number;
  userId: string;              // Firebase Auth UID للمستخدم المُعيَّن
  userName: string;            // اسم المستخدم
  clientId?: string;           // إذا تم الصرف على عميل
  clientName?: string;         // اسم العميل للمرجعية
  description: string;         // وصف المعاملة
  date: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;          // من قام بإنشاء السجل
}

// Letter Types
export type LetterType = 'official' | 'offer' | 'entitlement';

export interface Letter {
  id: string;
  type: LetterType;
  refNumber: string;
  date: string;
  recipientName: string;
  recipientTitle?: string;
  recipientAddress?: string;
  recipientPhone?: string;
  clientId?: string;
  subject: string;
  greeting: string;
  bodyParagraphs: string[];
  notes?: string;
  closing: string;
  signerName: string;
  signerTitle: string;
  showStamp: boolean;
  createdAt: string;
}
