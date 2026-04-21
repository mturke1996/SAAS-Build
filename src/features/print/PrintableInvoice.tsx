import { forwardRef } from 'react';
import { Box, Typography, Divider, Stack } from '@mui/material';
import { Invoice, Client } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { useBrand } from '../../config/BrandProvider';

/**
 * On-screen + print invoice — Minimal / Swiss (fintech): neutral surfaces, semantic money colors, brand accent only for structure.
 */
interface PrintableInvoiceProps {
  invoice: Invoice;
  client: Client;
}

export const PrintableInvoice = forwardRef<HTMLDivElement, PrintableInvoiceProps>(({ invoice, client }, ref) => {
  const brand = useBrand();
  const logoSrc = brand.logo.src || '';
  const primary = brand.palette.primary;
  const contactLine = [brand.contact.address, brand.contact.phone, brand.contact.website].filter(Boolean).join(' · ');

  const headerBorder = '#e5e7eb';
  const textMuted = '#6b7280';
  const textBody = '#111827';
  const rowAlt = '#f9fafb';

  return (
    <Box
      ref={ref}
      sx={{
        width: '100%',
        maxWidth: '210mm',
        mx: 'auto',
        p: { xs: 2, sm: 3.5 },
        backgroundColor: '#ffffff',
        color: textBody,
        fontFamily: 'var(--brand-font-arabic, "Cairo", sans-serif)',
        '@media print': {
          width: '210mm',
          minHeight: '297mm',
          p: '14mm',
          '@page': { size: 'A4', margin: 0 },
        },
      }}
    >
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2.5, pb: 2, borderBottom: `1px solid ${headerBorder}` }}>
        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ minWidth: 0 }}>
          {logoSrc && (
            <Box
              component="img"
              src={logoSrc}
              alt=""
              sx={{ width: 48, height: 48, objectFit: 'contain', borderRadius: 1, flexShrink: 0 }}
            />
          )}
          <Box sx={{ minWidth: 0 }}>
            <Typography fontWeight={800} sx={{ color: primary, fontSize: { xs: '0.9rem', sm: '1rem' }, lineHeight: 1.35 }}>
              {brand.fullName}
            </Typography>
            {brand.tagline && (
              <Typography sx={{ color: textMuted, fontSize: '0.7rem', fontWeight: 600, mt: 0.25 }}>
                {brand.tagline}
              </Typography>
            )}
          </Box>
        </Stack>
        <Box sx={{ textAlign: 'left', flexShrink: 0 }}>
          <Typography
            fontWeight={800}
            sx={{
              color: textMuted,
              fontSize: { xs: '0.65rem', sm: '0.7rem' },
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              lineHeight: 1.2,
            }}
          >
            فاتورة
          </Typography>
          <Typography fontWeight={800} sx={{ color: primary, fontSize: '0.85rem', mt: 0.5 }} dir="ltr">
            #{invoice.invoiceNumber}
          </Typography>
        </Box>
      </Stack>

      {contactLine && (
        <Typography sx={{ color: textMuted, fontSize: '0.7rem', fontWeight: 600, mb: 2.5, lineHeight: 1.5 }}>
          {contactLine}
        </Typography>
      )}

      {/* Client & dates */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'stretch', sm: 'flex-start' }}
        spacing={2}
        sx={{ mb: 2.5, gap: 2 }}
      >
        <Box
          sx={{
            flex: 1,
            minWidth: 0,
            py: 1.5,
            px: 1.5,
            borderInlineEnd: { sm: `2px solid ${primary}` },
            borderBottom: { xs: `1px solid ${headerBorder}`, sm: 'none' },
            pb: { xs: 2, sm: 0 },
          }}
        >
          <Typography sx={{ color: textMuted, fontSize: '0.65rem', fontWeight: 700, letterSpacing: 0.04, mb: 0.5 }}>
            فاتورة إلى
          </Typography>
          <Typography fontWeight={800} sx={{ fontSize: '0.85rem', color: textBody, lineHeight: 1.35 }}>
            {client.name}
          </Typography>
          {client.address && (
            <Typography sx={{ color: textMuted, fontSize: '0.72rem', lineHeight: 1.45, mt: 0.5 }}>{client.address}</Typography>
          )}
          {client.phone && (
            <Typography sx={{ color: textMuted, fontSize: '0.72rem', lineHeight: 1.45 }} dir="ltr">
              {client.phone}
            </Typography>
          )}
        </Box>
        <Box sx={{ width: { xs: '100%', sm: 200 }, flexShrink: 0 }}>
          <Stack spacing={0.75}>
            {[
              { label: 'الإصدار', value: formatDate(invoice.issueDate) },
              { label: 'الاستحقاق', value: formatDate(invoice.dueDate) },
              {
                label: 'الحالة',
                value: invoice.status === 'paid' ? 'مدفوعة' : 'غير مدفوعة',
                valueColor: invoice.status === 'paid' ? 'var(--brand-success, #059669)' : 'var(--brand-warning, #d97706)',
              },
            ].map((row, i) => (
              <Stack key={i} direction="row" justifyContent="space-between" alignItems="baseline" spacing={1}>
                <Typography sx={{ color: textMuted, fontSize: '0.7rem' }}>{row.label}</Typography>
                <Typography fontWeight={700} sx={{ fontSize: '0.72rem', color: row.valueColor || textBody }}>
                  {row.value}
                </Typography>
              </Stack>
            ))}
          </Stack>
        </Box>
      </Stack>

      {/* Line items */}
      <Box sx={{ mb: 2.5 }}>
        <Stack
          direction="row"
          sx={{
            bgcolor: '#f3f4f6',
            color: textBody,
            px: 1.25,
            py: 1,
            borderRadius: 1,
            mb: 0.5,
          }}
        >
          <Typography sx={{ flex: 1, fontSize: '0.72rem', fontWeight: 800 }}>الوصف</Typography>
          <Typography sx={{ width: 44, textAlign: 'center', fontSize: '0.72rem', fontWeight: 800 }}>الكمية</Typography>
          <Typography sx={{ width: 72, textAlign: 'center', fontSize: '0.72rem', fontWeight: 800 }}>السعر</Typography>
          <Typography sx={{ width: 80, textAlign: 'left', fontSize: '0.72rem', fontWeight: 800 }}>الإجمالي</Typography>
        </Stack>
        {invoice.items.map((item, index) => (
          <Stack
            key={index}
            direction="row"
            alignItems="center"
            sx={{
              px: 1.25,
              py: 1.1,
              bgcolor: index % 2 === 0 ? 'transparent' : rowAlt,
              borderBottom: `1px solid ${headerBorder}`,
            }}
          >
            <Typography sx={{ flex: 1, fontSize: '0.78rem', fontWeight: 600, minWidth: 0 }}>{item.description}</Typography>
            <Typography sx={{ width: 44, textAlign: 'center', fontSize: '0.78rem' }}>{item.quantity}</Typography>
            <Typography
              component="span"
              dir="ltr"
              className="money-ltr font-num tabular"
              sx={{ width: 72, textAlign: 'center', fontSize: '0.78rem' }}
            >
              {formatCurrency(item.unitPrice)}
            </Typography>
            <Typography
              component="span"
              dir="ltr"
              className="money-ltr font-num tabular"
              sx={{ width: 80, textAlign: 'left', fontSize: '0.78rem', fontWeight: 700 }}
            >
              {formatCurrency(item.total)}
            </Typography>
          </Stack>
        ))}
      </Box>

      {/* Totals */}
      <Stack alignItems="flex-end" sx={{ mb: 3 }}>
        <Box sx={{ width: '100%', maxWidth: 320 }}>
          <Stack spacing={1}>
            <Stack direction="row" justifyContent="space-between">
              <Typography sx={{ color: textMuted, fontSize: '0.8rem' }}>المجموع الفرعي</Typography>
              <Typography component="span" dir="ltr" className="money-ltr font-num tabular" fontWeight={700} sx={{ fontSize: '0.8rem' }}>
                {formatCurrency(invoice.subtotal)}
              </Typography>
            </Stack>
            {invoice.taxAmount > 0 && (
              <Stack direction="row" justifyContent="space-between">
                <Typography sx={{ color: textMuted, fontSize: '0.8rem' }}>الضريبة ({invoice.taxRate}%)</Typography>
                <Typography component="span" dir="ltr" className="money-ltr font-num tabular" fontWeight={700} sx={{ fontSize: '0.8rem' }}>
                  {formatCurrency(invoice.taxAmount)}
                </Typography>
              </Stack>
            )}
            <Divider sx={{ borderColor: headerBorder }} />
            <Stack direction="row" justifyContent="space-between" alignItems="baseline">
              <Typography fontWeight={800} sx={{ color: textBody, fontSize: '0.95rem' }}>
                الإجمالي
              </Typography>
              <Typography
                component="span"
                dir="ltr"
                className="money-ltr font-num tabular"
                fontWeight={900}
                sx={{ color: primary, fontSize: '1.05rem' }}
              >
                {formatCurrency(invoice.total)}
              </Typography>
            </Stack>
          </Stack>
        </Box>
      </Stack>

      {invoice.notes && (
        <Box
          sx={{
            p: 1.75,
            borderInlineStart: `3px solid ${primary}`,
            bgcolor: rowAlt,
            borderRadius: 1,
            mb: 2.5,
          }}
        >
          <Typography sx={{ color: textMuted, fontSize: '0.7rem', fontWeight: 700, mb: 0.75 }}>
            ملاحظات
          </Typography>
          <Typography sx={{ color: textBody, fontSize: '0.8rem', lineHeight: 1.6 }}>
            {invoice.notes}
          </Typography>
        </Box>
      )}

      <Box sx={{ textAlign: 'center', pt: 2, borderTop: `1px solid ${headerBorder}` }}>
        <Typography fontWeight={700} sx={{ color: primary, fontSize: '0.78rem' }}>
          {brand.fullName}
        </Typography>
        {contactLine && (
          <Typography sx={{ color: textMuted, fontSize: '0.68rem', mt: 0.5 }}>
            {contactLine}
          </Typography>
        )}
      </Box>
    </Box>
  );
});

PrintableInvoice.displayName = 'PrintableInvoice';
