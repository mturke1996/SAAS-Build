// @ts-nocheck
import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import './pdfFonts';
import { PDF_FONT_FAMILY } from './pdfFonts';
import type { Client, Expense, Payment, StandaloneDebt, Worker } from '../../types';
import { expenseCategories } from '../../utils/formatters';
import { getPdfBrand, buildFooterLine } from './pdfBrand';

const C = {
  primary: '#4a5d4a',
  accent: '#8b7e6a',
  text: '#1a1f1a',
  muted: '#6b7f6b',
  light: '#888',
  white: '#fff',
  border: '#e8e5de',
  rowAlt: '#fafaf8',
  success: '#0d9668',
  warning: '#c9a54e',
  danger: '#d64545',
  headerBg: '#4a5d4a',
  lightBg: '#f8f7f4',
};

const s = StyleSheet.create({
  page: {
    fontFamily: PDF_FONT_FAMILY,
    fontSize: 9,
    color: C.text,
    backgroundColor: C.white,
    paddingTop: 32,
    paddingBottom: 52,
    paddingHorizontal: 38,
  },
  
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  
  headerTitleBox: { textAlign: 'left', alignItems: 'flex-start' },
  reportTitle: { fontSize: 24, fontWeight: 'bold', color: '#e0dcd4', letterSpacing: 1, marginBottom: 2 },
  reportSubtitle: { fontSize: 11, fontWeight: 'bold', color: C.primary },
  
  headerCompanyBox: { flexDirection: 'row', alignItems: 'center' },
  companyTextBox: { justifyContent: 'center', alignItems: 'flex-end', marginRight: 12 },
  companyName: { fontSize: 13, fontWeight: 'bold', color: C.primary, marginBottom: 2 },
  companySub: { fontSize: 9, fontWeight: 'bold', color: C.accent },
  logo: { width: 50, height: 50, objectFit: 'contain', borderRadius: 8 },

  contactLine: { borderBottomWidth: 2, borderBottomColor: C.primary, paddingBottom: 6, marginBottom: 20, alignItems: 'flex-end' },
  contactText: { fontSize: 9, fontWeight: 'bold', color: C.muted },

  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  
  datesBox: { width: '40%' },
  dateRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  dateLabel: { fontSize: 9, color: '#999' },
  dateValue: { fontSize: 9, fontWeight: 'bold', color: C.text },

  clientBox: { paddingVertical: 4, paddingRight: 10, borderRightWidth: 2, borderRightColor: C.primary, width: '50%', alignItems: 'flex-end' },
  sectionLabel: { fontSize: 7.5, fontWeight: 'bold', color: C.accent, marginBottom: 2 },
  clientName: { fontSize: 13, fontWeight: 'bold', color: '#2d3a2d', marginBottom: 2 },
  clientSub: { fontSize: 9, color: '#888', marginTop: 2 },

  summaryRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  summaryCard: {
    flex: 1, paddingVertical: 14, paddingHorizontal: 10,
    backgroundColor: '#fafaf8',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e8e5de',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryLabel: { fontSize: 8.5, color: '#6b7f6b', marginBottom: 6, fontWeight: 'bold' },
  summaryValueCont: { flexDirection: 'row', alignItems: 'center' },
  summaryValue: { fontSize: 13, fontWeight: 'bold', color: C.primary, textAlign: 'left' },
  summaryCurrency: { fontSize: 9, color: '#888', fontWeight: 'bold', textAlign: 'left' },

  sectionTitle: {
    fontSize: 11, fontWeight: 'bold', color: C.primary,
    marginBottom: 5, marginTop: 16,
    paddingBottom: 5,
    borderBottomWidth: 1.5, borderBottomColor: C.border,
    textAlign: 'right',
  },

  tableHead: { flexDirection: 'row', backgroundColor: C.headerBg, paddingVertical: 8, paddingHorizontal: 10, borderRadius: 3, marginBottom: 2 },
  th: { color: C.white, fontSize: 9.5, fontWeight: 'bold', textAlign: 'right' },
  tableRow: { flexDirection: 'row', paddingVertical: 8, paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: '#f0efeb' },
  rowEven: { backgroundColor: C.rowAlt },
  totalRow: { flexDirection: 'row', paddingVertical: 8, paddingHorizontal: 10, backgroundColor: '#f0ede7', borderTopWidth: 1.5, borderTopColor: C.primary, marginTop: 1, borderRadius: 2 },
  
  td: { fontSize: 9, color: C.text, textAlign: 'right' },
  tdBold: { fontSize: 9, fontWeight: 'bold', color: C.text, textAlign: 'right' },
  tdPos: { fontSize: 9, fontWeight: 'bold', color: C.success, textAlign: 'right' },
  tdNeg: { fontSize: 9, fontWeight: 'bold', color: C.danger, textAlign: 'right' },
  
  cDesc2: { flex: 1, textAlign: 'right', paddingRight: 4 },
  cNote2: { width: '20%', textAlign: 'right', paddingRight: 4 },
  cCat: { width: '15%', textAlign: 'right', paddingRight: 4 },
  cDate: { width: '15%', textAlign: 'center' },
  cAmt: { width: 70, textAlign: 'left', paddingLeft: 4, direction: 'rtl' },

  cPayNote: { width: '25%', textAlign: 'right' },
  cPayBy: { width: '20%', textAlign: 'right' },
  cMethod: { width: '20%', textAlign: 'right' },
  cPayAmt: { width: 70, textAlign: 'left', paddingLeft: 4, direction: 'rtl' },

  cParty: { width: '20%', textAlign: 'right' },
  cDebtDesc: { flex: 1, textAlign: 'right' },
  cMoneyCol: { width: 60, textAlign: 'left', direction: 'rtl' },

  cName: { width: '20%', textAlign: 'right' },
  cJob: { flex: 1, textAlign: 'right' },
  cStatus: { width: 50, textAlign: 'center' },
  
  footer: { position: 'absolute', bottom: 16, left: 38, right: 38, textAlign: 'center', borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 8 },
  footerTitle: { fontSize: 10, fontWeight: 'bold', color: C.primary, marginBottom: 3 },
  footerText: { fontSize: 8, color: '#888' },
});

// UI Components
const CurrencyValue = ({ val, color = C.primary }: { val: number, color?: string }) => (
  <View style={s.summaryValueCont}>
    <Text style={[s.summaryValue, { color }]}>{fmt(val)}</Text>
    <Text style={[s.summaryCurrency, { color }]}> د.ل</Text>
  </View>
);
const fmtNum = (n: number) => {
  const rounded = Math.round(n);
  return new Intl.NumberFormat('en-US').format(rounded);
};
const fmt = (n: number) => fmtNum(n);
const fmtDate = (d: string) => {
  try {
    const dt = new Date(d);
    return `${dt.getDate().toString().padStart(2, '0')}/${(dt.getMonth() + 1).toString().padStart(2, '0')}/${dt.getFullYear()}`;
  } catch { return d; }
};
const today = () => fmtDate(new Date().toISOString());
const getCatLabel = (cat: string) => (expenseCategories as any)[cat] || cat;
const getPayLabel = (m: string) => ({
  cash: 'نقدا',
  check: 'شيك',
  bank_transfer: 'تحويل بنكي',
  credit_card: 'بطاقة ائتمان',
  mobile_payment: 'دفع الكتروني',
}[m] || m);

const PDFHeader = ({ title, subtitle }: { title: string; subtitle?: string }) => {
  const B = getPdfBrand();
  return (
    <View wrap={false}>
      <View style={s.header}>
        <View style={s.headerTitleBox}>
          <Text style={s.reportTitle}>{title}</Text>
          <Text style={s.reportSubtitle}>{subtitle}</Text>
        </View>
        <View style={s.headerCompanyBox}>
          <View style={s.companyTextBox}>
            <Text style={s.companyName}>{B.fullName}</Text>
            {B.tagline ? <Text style={s.companySub}>{B.tagline}</Text> : null}
          </View>
          {B.logoUrl ? <Image src={B.logoUrl} style={s.logo} /> : null}
        </View>
      </View>
      <View style={s.contactLine}>
        <Text style={s.contactText}>{buildFooterLine(B)}</Text>
      </View>
    </View>
  );
};

const InfoBar = ({ client }: { client: Client }) => (
  <View style={s.infoRow}>
    <View style={s.datesBox}>
      <View style={s.dateRow}>
        <Text style={s.dateValue}>{today()}</Text>
        <Text style={s.dateLabel}>تاريخ التقرير</Text>
      </View>
    </View>
    <View style={s.clientBox}>
      <Text style={s.sectionLabel}>تقرير لعميل</Text>
      <Text style={s.clientName}>{client.name}</Text>
      {client.address && <Text style={s.clientSub}>{client.address}</Text>}
      {client.phone && <Text style={s.clientSub}>{client.phone}</Text>}
    </View>
  </View>
);

const PDFFooter = () => {
  const B = getPdfBrand();
  return (
    <View style={s.footer} fixed>
      <Text style={s.footerTitle}>{B.fullName}</Text>
      <Text style={s.footerText}>{buildFooterLine(B)}</Text>
    </View>
  );
};

// ═══════════════════════════════════════════════
// 1. EXPENSES PDF
// ═══════════════════════════════════════════════
interface ExpensesPDFProps { client: Client; expenses: Expense[]; total: number; }

export const ExpensesPDF: React.FC<ExpensesPDFProps> = ({ client, expenses, total }) => (
  <Document title={`مصروفات-${client.name}`} language="ar">
    <Page size="A4" style={s.page}>
      <PDFHeader title="EXPENSES" subtitle="كشف المصروفات" />
      <InfoBar client={client} />

      <View style={s.summaryRow}>
        <View style={s.summaryCard}>
          <Text style={s.summaryLabel}>عدد السجلات</Text>
          <Text style={s.summaryValue}>{expenses.length}</Text>
        </View>
        <View style={[s.summaryCard, { borderTopWidth: 3, borderTopColor: C.danger, backgroundColor: '#fffcfc' }]}>
          <Text style={s.summaryLabel}>إجمالي المصروفات</Text>
          <CurrencyValue val={total} color={C.danger} />
        </View>
      </View>

      <View style={s.tableHead}>
        <Text style={[s.th, s.cAmt]}>المبلغ</Text>
        <Text style={[s.th, s.cDate]}>التاريخ</Text>
        <Text style={[s.th, s.cCat]}>التصنيف</Text>
        <Text style={[s.th, s.cNote2]}>الملاحظات</Text>
        <Text style={[s.th, s.cDesc2]}>الوصف</Text>
      </View>
      {expenses.map((e, i) => (
        <View key={i} style={[s.tableRow, i % 2 !== 0 && s.rowEven]}>
          <Text style={[s.tdBold, s.cAmt]}>{fmt(e.amount)} د.ل</Text>
          <Text style={[s.td, s.cDate]}>{fmtDate(e.date)}</Text>
          <Text style={[s.td, s.cCat]}>{getCatLabel(e.category)}</Text>
          <Text style={[s.td, s.cNote2]}>{e.notes || '-'}</Text>
          <Text style={[s.tdBold, s.cDesc2]}>{e.description}</Text>
        </View>
      ))}
      <View style={s.totalRow}>
        <Text style={[s.tdBold, s.cAmt]}>{fmt(total)} د.ل</Text>
        <Text style={[s.tdBold, { flex: 1, textAlign: 'right' }]}>الاجمالي</Text>
      </View>

      <PDFFooter />
    </Page>
  </Document>
);

// ═══════════════════════════════════════════════
// 2. PAYMENTS PDF
// ═══════════════════════════════════════════════
interface PaymentsPDFProps { client: Client; payments: Payment[]; total: number; }

export const PaymentsPDF: React.FC<PaymentsPDFProps> = ({ client, payments, total }) => (
  <Document title={`مدفوعات-${client.name}`} language="ar">
    <Page size="A4" style={s.page}>
      <PDFHeader title="PAYMENTS" subtitle="كشف المدفوعات" />
      <InfoBar client={client} />

      <View style={s.summaryRow}>
        <View style={s.summaryCard}>
          <Text style={s.summaryLabel}>عدد الدفعات</Text>
          <Text style={s.summaryValue}>{payments.length}</Text>
        </View>
        <View style={[s.summaryCard, { borderTopWidth: 3, borderTopColor: C.success, backgroundColor: '#f5fbf8' }]}>
          <Text style={s.summaryLabel}>إجمالي المدفوعات</Text>
          <CurrencyValue val={total} color={C.success} />
        </View>
      </View>

      <View style={s.tableHead}>
        <Text style={[s.th, s.cPayAmt]}>المبلغ</Text>
        <Text style={[s.th, s.cDate]}>التاريخ</Text>
        <Text style={[s.th, s.cMethod]}>طريقة الدفع</Text>
        <Text style={[s.th, s.cPayBy]}>بواسطة</Text>
        <Text style={[s.th, s.cPayNote]}>ملاحظات</Text>
      </View>
      {payments.map((p, i) => (
        <View key={i} style={[s.tableRow, i % 2 !== 0 && s.rowEven]}>
          <Text style={[s.tdBold, s.cPayAmt, { color: C.success }]}>{fmt(p.amount)} د.ل</Text>
          <Text style={[s.td, s.cDate]}>{fmtDate(p.paymentDate)}</Text>
          <Text style={[s.td, s.cMethod]}>{getPayLabel(p.paymentMethod)}</Text>
          <Text style={[s.td, s.cPayBy]}>{p.createdBy || '-'}</Text>
          <Text style={[s.td, s.cPayNote]}>{p.notes || '-'}</Text>
        </View>
      ))}
      <View style={s.totalRow}>
        <Text style={[s.tdBold, s.cPayAmt]}>{fmt(total)} د.ل</Text>
        <Text style={[s.tdBold, { flex: 1, textAlign: 'right' }]}>الاجمالي</Text>
      </View>

      <PDFFooter />
    </Page>
  </Document>
);

// ═══════════════════════════════════════════════
// 3. WORKERS PDF
// ═══════════════════════════════════════════════
interface WorkersPDFProps {
  client: Client; workers: Worker[];
  totalAgreed: number; totalPaid: number; totalDue: number;
}

export const WorkersPDF: React.FC<WorkersPDFProps> = ({ client, workers, totalAgreed, totalPaid, totalDue }) => (
  <Document title={`عمال-${client.name}`} language="ar">
    <Page size="A4" style={s.page}>
      <PDFHeader title="WORKERS" subtitle="كشف العمال والمقاولين" />
      <InfoBar client={client} />

      <View style={s.summaryRow}>
        <View style={s.summaryCard}>
          <Text style={s.summaryLabel}>إجمالي الإتفاقيات</Text>
          <CurrencyValue val={totalAgreed} />
        </View>
        <View style={[s.summaryCard, { borderTopWidth: 3, borderTopColor: C.success, backgroundColor: '#f5fbf8' }]}>
          <Text style={s.summaryLabel}>المدفوع مسبقاً</Text>
          <CurrencyValue val={totalPaid} color={C.success} />
        </View>
        <View style={[s.summaryCard, { borderTopWidth: 3, borderTopColor: C.danger, backgroundColor: '#fffcfc' }]}>
          <Text style={s.summaryLabel}>المتبقي لهم</Text>
          <CurrencyValue val={totalDue} color={C.danger} />
        </View>
      </View>

      <View style={s.tableHead}>
        <Text style={[s.th, s.cMoneyCol]}>المتبقي</Text>
        <Text style={[s.th, s.cMoneyCol]}>المدفوع</Text>
        <Text style={[s.th, s.cMoneyCol]}>الإتفاق</Text>
        <Text style={[s.th, s.cStatus]}>الحالة</Text>
        <Text style={[s.th, s.cJob]}>طبيعة العمل</Text>
        <Text style={[s.th, s.cName]}>اسم العامل</Text>
      </View>
      {workers.map((w, i) => (
        <View key={i} style={[s.tableRow, i % 2 !== 0 && s.rowEven]}>
          <Text style={[s.tdNeg, s.cMoneyCol]}>{fmt(w.remainingAmount)} د.ل</Text>
          <Text style={[s.tdPos, s.cMoneyCol]}>{fmt(w.paidAmount)} د.ل</Text>
          <Text style={[s.tdBold, s.cMoneyCol]}>{fmt(w.totalAmount)} د.ل</Text>
          <Text style={[s.td, s.cStatus]}>{w.status === 'completed' ? 'تصفية' : 'مستمر'}</Text>
          <Text style={[s.td, s.cJob]}>{w.jobType || 'تم التعيين'}</Text>
          <Text style={[s.tdBold, s.cName]}>{w.name}</Text>
        </View>
      ))}
      <View style={s.totalRow}>
        <Text style={[s.tdBold, s.cMoneyCol, { color: C.danger }]}>{fmt(totalDue)} د.ل</Text>
        <Text style={[s.tdBold, s.cMoneyCol, { color: C.success }]}>{fmt(totalPaid)} د.ل</Text>
        <Text style={[s.tdBold, s.cMoneyCol]}>{fmt(totalAgreed)} د.ل</Text>
        <Text style={[s.tdBold, { flex: 1, textAlign: 'right' }]}>اجمالي العمال</Text>
      </View>

      <PDFFooter />
    </Page>
  </Document>
);

// ═══════════════════════════════════════════════
// 4. FULL REPORT PDF
// ═══════════════════════════════════════════════
interface FullReportPDFProps {
  client: Client;
  expenses: Expense[];
  payments: Payment[];
  debts: StandaloneDebt[];
  workers: Worker[];
  summary: {
    totalPaid: number; profit: number; profitPercentage: number;
    totalExpenses: number; totalDebts: number; totalObligations: number;
    remaining: number; totalWorkersAgreed: number; totalWorkersPaid: number; totalWorkersDue: number;
  };
}

export const FullReportPDF: React.FC<FullReportPDFProps> = ({
  client, expenses, payments, debts, workers, summary
}) => (
  <Document title={`تقرير-${client.name}`} language="ar">
    <Page size="A4" style={s.page}>
      <PDFHeader title="FULL REPORT" subtitle="التقرير الشامل" />
      <InfoBar client={client} />

      <View style={s.summaryRow}>
        <View style={[s.summaryCard, { borderTopWidth: 3, borderTopColor: C.success, backgroundColor: '#f5fbf8' }]}>
          <Text style={s.summaryLabel}>إجمالي المدفوعات</Text>
          <CurrencyValue val={summary.totalPaid} color={C.success} />
        </View>
        <View style={[s.summaryCard, { borderTopWidth: 3, borderTopColor: C.warning, backgroundColor: '#fdfbfa' }]}>
          <Text style={s.summaryLabel}>الربح ({summary.profitPercentage}%)</Text>
          <CurrencyValue val={summary.profit} color={C.warning} />
        </View>
        <View style={[s.summaryCard, { borderTopWidth: 3, borderTopColor: C.danger, backgroundColor: '#fffcfc' }]}>
          <Text style={s.summaryLabel}>مصروفات + ديون</Text>
          <CurrencyValue val={summary.totalObligations} color={C.danger} />
        </View>
        <View style={[s.summaryCard, { borderTopWidth: 3, borderTopColor: summary.remaining >= 0 ? C.success : C.danger, backgroundColor: summary.remaining >= 0 ? '#f5fbf8' : '#fffcfc' }]}>
          <Text style={s.summaryLabel}>المتبقي</Text>
          <CurrencyValue val={summary.remaining} color={summary.remaining >= 0 ? C.success : C.danger} />
        </View>
      </View>

      {expenses.length > 0 && (
        <View style={{ marginBottom: 16 }}>
          <View wrap={false}>
            <Text style={s.sectionTitle}>المصروفات ({expenses.length})</Text>
            <View style={s.tableHead}>
              <Text style={[s.th, s.cAmt]}>المبلغ</Text>
              <Text style={[s.th, s.cDate]}>التاريخ</Text>
              <Text style={[s.th, s.cCat]}>التصنيف</Text>
              <Text style={[s.th, s.cNote2]}>الملاحظات</Text>
              <Text style={[s.th, s.cDesc2]}>الوصف</Text>
            </View>
          </View>
          {expenses.map((e, i) => (
            <View key={i} style={[s.tableRow, i % 2 !== 0 && s.rowEven]} wrap={false}>
              <Text style={[s.tdBold, s.cAmt, { color: C.danger }]}>{fmt(e.amount)} د.ل</Text>
              <Text style={[s.td, s.cDate]}>{fmtDate(e.date)}</Text>
              <Text style={[s.td, s.cCat]}>{getCatLabel(e.category)}</Text>
              <Text style={[s.td, s.cNote2]}>{e.notes || '-'}</Text>
              <Text style={[s.tdBold, s.cDesc2]}>{e.description}</Text>
            </View>
          ))}
          <View style={s.totalRow} wrap={false}>
            <Text style={[s.tdBold, s.cAmt]}>{fmt(summary.totalExpenses)} د.ل</Text>
            <Text style={[s.tdBold, { flex: 1, textAlign: 'right' }]}>اجمالي المصروفات</Text>
          </View>
        </View>
      )}

      {payments.length > 0 && (
        <View style={{ marginBottom: 16 }}>
          <View wrap={false}>
            <Text style={s.sectionTitle}>المدفوعات ({payments.length})</Text>
            <View style={s.tableHead}>
              <Text style={[s.th, s.cPayAmt]}>المبلغ</Text>
              <Text style={[s.th, s.cDate]}>التاريخ</Text>
              <Text style={[s.th, s.cMethod]}>طريقة الدفع</Text>
              <Text style={[s.th, s.cPayBy]}>بواسطة</Text>
              <Text style={[s.th, s.cPayNote]}>ملاحظات</Text>
            </View>
          </View>
          {payments.map((p, i) => (
            <View key={i} style={[s.tableRow, i % 2 !== 0 && s.rowEven]} wrap={false}>
              <Text style={[s.tdBold, s.cPayAmt, { color: C.success }]}>{fmt(p.amount)} د.ل</Text>
              <Text style={[s.td, s.cDate]}>{fmtDate(p.paymentDate)}</Text>
              <Text style={[s.td, s.cMethod]}>{getPayLabel(p.paymentMethod)}</Text>
              <Text style={[s.td, s.cPayBy]}>{p.createdBy || '-'}</Text>
              <Text style={[s.td, s.cPayNote]}>{p.notes || '-'}</Text>
            </View>
          ))}
          <View style={s.totalRow} wrap={false}>
             <Text style={[s.tdBold, s.cPayAmt]}>{fmt(summary.totalPaid)} د.ل</Text>
             <Text style={[s.tdBold, { flex: 1, textAlign: 'right' }]}>اجمالي المدفوعات</Text>
          </View>
        </View>
      )}

      {debts.length > 0 && (
        <View style={{ marginBottom: 16 }}>
          <View wrap={false}>
            <Text style={s.sectionTitle}>الديون ({debts.length})</Text>
            <View style={s.tableHead}>
              <Text style={[s.th, s.cMoneyCol]}>متبقي</Text>
              <Text style={[s.th, s.cMoneyCol]}>مدفوع</Text>
              <Text style={[s.th, s.cMoneyCol]}>المبلغ</Text>
              <Text style={[s.th, s.cDebtDesc]}>الوصف</Text>
              <Text style={[s.th, s.cParty]}>الطرف</Text>
            </View>
          </View>
          {debts.map((d, i) => (
            <View key={i} style={[s.tableRow, i % 2 !== 0 && s.rowEven]} wrap={false}>
              <Text style={[s.tdNeg, s.cMoneyCol]}>{fmt(d.remainingAmount)} د.ل</Text>
              <Text style={[s.tdPos, s.cMoneyCol]}>{fmt(d.paidAmount)} د.ل</Text>
              <Text style={[s.tdBold, s.cMoneyCol]}>{fmt(d.amount)} د.ل</Text>
              <Text style={[s.td, s.cDebtDesc]}>{d.description}</Text>
              <Text style={[s.tdBold, s.cParty]}>{d.partyName}</Text>
            </View>
          ))}
          <View style={s.totalRow} wrap={false}>
            <Text style={[s.td, s.cMoneyCol]}></Text>
            <Text style={[s.td, s.cMoneyCol]}></Text>
            <Text style={[s.tdBold, s.cMoneyCol]}>{fmt(summary.totalDebts)} د.ل</Text>
            <Text style={[s.tdBold, { flex: 1, textAlign: 'right' }]}>اجمالي الديون</Text>
          </View>
        </View>
      )}

      {workers.length > 0 && (
        <View style={{ marginBottom: 16 }}>
          <View wrap={false}>
            <Text style={s.sectionTitle}>العمال والمقاولين ({workers.length})</Text>
            <View style={s.tableHead}>
              <Text style={[s.th, s.cMoneyCol]}>المتبقي</Text>
              <Text style={[s.th, s.cMoneyCol]}>المدفوع</Text>
              <Text style={[s.th, s.cMoneyCol]}>الإتفاق</Text>
              <Text style={[s.th, s.cStatus]}>الحالة</Text>
              <Text style={[s.th, s.cJob]}>طبيعة العمل</Text>
              <Text style={[s.th, s.cName]}>اسم العامل</Text>
            </View>
          </View>
          {workers.map((w, i) => (
            <View key={i} style={[s.tableRow, i % 2 !== 0 && s.rowEven]} wrap={false}>
              <Text style={[s.tdNeg, s.cMoneyCol]}>{fmt(w.remainingAmount)} د.ل</Text>
              <Text style={[s.tdPos, s.cMoneyCol]}>{fmt(w.paidAmount)} د.ل</Text>
              <Text style={[s.tdBold, s.cMoneyCol]}>{fmt(w.totalAmount)} د.ل</Text>
              <Text style={[s.td, s.cStatus]}>{w.status === 'completed' ? 'تصفية' : 'مستمر'}</Text>
              <Text style={[s.td, s.cJob]}>{w.jobType || 'تم التعيين'}</Text>
              <Text style={[s.tdBold, s.cName]}>{w.name}</Text>
            </View>
          ))}
          <View style={s.totalRow} wrap={false}>
            <Text style={[s.tdBold, s.cMoneyCol, { color: C.danger }]}>{fmt(summary.totalWorkersDue)} د.ل</Text>
            <Text style={[s.tdBold, s.cMoneyCol, { color: C.success }]}>{fmt(summary.totalWorkersPaid)} د.ل</Text>
            <Text style={[s.tdBold, s.cMoneyCol]}>{fmt(summary.totalWorkersAgreed)} د.ل</Text>
            <Text style={[s.tdBold, { flex: 1, textAlign: 'right' }]}>اجمالي العمال</Text>
          </View>
        </View>
      )}

      <PDFFooter />
    </Page>
  </Document>
);

// ═══════════════════════════════════════════════
// 5. DEBTS PDF
// ═══════════════════════════════════════════════
interface DebtsPDFProps { client: Client; debts: StandaloneDebt[]; total: number; }

export const DebtsPDF: React.FC<DebtsPDFProps> = ({ client, debts, total }) => (
  <Document title={`ديون-${client.name}`} language="ar">
    <Page size="A4" style={s.page}>
      <PDFHeader title="DEBTS" subtitle="كشف الديون" />
      <InfoBar client={client} />

      <View style={s.summaryRow}>
        <View style={s.summaryCard}>
          <Text style={s.summaryLabel}>عدد الديون</Text>
          <Text style={s.summaryValue}>{debts.length}</Text>
        </View>
        <View style={[s.summaryCard, { borderTopWidth: 3, borderTopColor: C.warning, backgroundColor: '#fdfbfa' }]}>
          <Text style={s.summaryLabel}>إجمالي الديون المتبقية</Text>
          <CurrencyValue val={total} color={C.warning} />
        </View>
      </View>

      <View style={s.tableHead}>
        <Text style={[s.th, s.cMoneyCol]}>متبقي</Text>
        <Text style={[s.th, s.cMoneyCol]}>مدفوع</Text>
        <Text style={[s.th, s.cMoneyCol]}>المبلغ</Text>
        <Text style={[s.th, s.cDebtDesc]}>الوصف</Text>
        <Text style={[s.th, s.cParty]}>الطرف</Text>
      </View>
      {debts.map((d, i) => (
        <View key={i} style={[s.tableRow, i % 2 !== 0 && s.rowEven]}>
          <Text style={[s.tdNeg, s.cMoneyCol]}>{fmt(d.remainingAmount)} د.ل</Text>
          <Text style={[s.tdPos, s.cMoneyCol]}>{fmt(d.paidAmount)} د.ل</Text>
          <Text style={[s.tdBold, s.cMoneyCol]}>{fmt(d.amount)} د.ل</Text>
          <Text style={[s.td, s.cDebtDesc]}>{d.description}</Text>
          <Text style={[s.tdBold, s.cParty]}>{d.partyName}</Text>
        </View>
      ))}
      <View style={s.totalRow}>
        <Text style={[s.tdBold, s.cMoneyCol]}>{fmt(total)} د.ل</Text>
        <Text style={[s.tdBold, { flex: 1, textAlign: 'right' }]}>إجمالي الديون المتبقية</Text>
      </View>

      <PDFFooter />
    </Page>
  </Document>
);
