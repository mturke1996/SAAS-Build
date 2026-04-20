import { forwardRef } from 'react';
import { Box, Typography, Divider, Stack } from '@mui/material';
import { Invoice, Client } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { useBrand } from '../../config/BrandProvider';

interface PrintableInvoiceProps {
  invoice: Invoice;
  client: Client;
}

export const PrintableInvoice = forwardRef<HTMLDivElement, PrintableInvoiceProps>(({ invoice, client }, ref) => {
  const brand = useBrand();
  const logoSrc = brand.logo.src || '';
  const primary = brand.palette.primary;
  const accent = brand.palette.secondary;
  const contactLine = [brand.contact.address, brand.contact.phone, brand.contact.website].filter(Boolean).join(' • ');
  return (
    <Box
      ref={ref}
      sx={{
        width: '100%',
        maxWidth: '210mm',
        mx: 'auto',
        p: { xs: 2.5, sm: 4 },
        backgroundColor: 'white',
        color: '#1a1f1a',
        fontFamily: "'Cairo', sans-serif",
        '@media print': {
          width: '210mm',
          minHeight: '297mm',
          p: '15mm',
          '@page': { size: 'A4', margin: 0 },
        },
      }}
    >
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 3 }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          {logoSrc && (
            <img
              src={logoSrc}
              alt={brand.name}
              style={{ width: 50, height: 50, objectFit: 'contain', borderRadius: 8 }}
            />
          )}
          <Box>
            <Typography fontWeight={800} sx={{ color: primary, fontSize: { xs: '0.85rem', sm: '1.1rem' }, lineHeight: 1.3 }}>
              {brand.fullName}
            </Typography>
            {brand.tagline && (
              <Typography sx={{ color: accent, fontSize: '0.65rem', fontWeight: 600 }}>
                {brand.tagline}
              </Typography>
            )}
          </Box>
        </Stack>
        <Box sx={{ textAlign: 'left' }}>
          <Typography fontWeight={900} sx={{ color: '#e0dcd4', fontSize: { xs: '1.2rem', sm: '1.8rem' }, letterSpacing: 1, lineHeight: 1 }}>
            INVOICE
          </Typography>
          <Typography fontWeight={700} sx={{ color: primary, fontSize: '0.8rem' }}>
            #{invoice.invoiceNumber}
          </Typography>
        </Box>
      </Stack>

      {/* Contact line */}
      <Box sx={{ borderBottom: `2px solid ${primary}`, pb: 1, mb: 3 }}>
        <Typography sx={{ color: '#6b7f6b', fontSize: '0.7rem', fontWeight: 600 }}>
          {contactLine}
        </Typography>
      </Box>

      {/* Client & Dates */}
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 3, gap: 3 }}>
        <Box sx={{ py: 1, px: 1.2, borderRight: '2px solid #4a5d4a', maxWidth: '55%' }}>
          <Typography sx={{ color: '#8b7e6a', fontSize: '0.55rem', fontWeight: 600, letterSpacing: 0.5, mb: 0.2 }}>فاتورة إلى</Typography>
          <Typography fontWeight={800} sx={{ fontSize: '0.8rem', color: '#2d3a2d', lineHeight: 1.3 }}>{client.name}</Typography>
          {client.address && <Typography sx={{ color: '#888', fontSize: '0.65rem', lineHeight: 1.3 }}>{client.address}</Typography>}
          {client.phone && <Typography sx={{ color: '#888', fontSize: '0.65rem', lineHeight: 1.3 }}>{client.phone}</Typography>}
        </Box>
        <Box>
          <Stack spacing={0.6}>
            {[
              { label: 'الإصدار', value: formatDate(invoice.issueDate) },
              { label: 'الاستحقاق', value: formatDate(invoice.dueDate) },
              { label: 'الحالة', value: invoice.status === 'paid' ? 'مدفوعة' : 'غير مدفوعة', color: invoice.status === 'paid' ? '#0d9668' : '#c9a54e' },
            ].map((row, i) => (
              <Stack key={i} direction="row" justifyContent="space-between" spacing={1.5}>
                <Typography sx={{ color: '#999', fontSize: '0.65rem' }}>{row.label}</Typography>
                <Typography fontWeight={700} sx={{ fontSize: '0.65rem', color: row.color || '#1a1f1a' }}>{row.value}</Typography>
              </Stack>
            ))}
          </Stack>
        </Box>
      </Stack>

      {/* Items - responsive cards on mobile, table-like on print */}
      <Box sx={{ mb: 3 }}>
        {/* Header row */}
        <Stack
          direction="row"
          sx={{ bgcolor: '#4a5d4a', color: 'white', p: 1.2, borderRadius: 1.5, mb: 0.5 }}
        >
          <Typography sx={{ flex: 1, fontSize: '0.7rem', fontWeight: 700 }}>الوصف</Typography>
          <Typography sx={{ width: 50, textAlign: 'center', fontSize: '0.7rem', fontWeight: 700 }}>الكمية</Typography>
          <Typography sx={{ width: 70, textAlign: 'center', fontSize: '0.7rem', fontWeight: 700 }}>السعر</Typography>
          <Typography sx={{ width: 80, textAlign: 'left', fontSize: '0.7rem', fontWeight: 700 }}>الإجمالي</Typography>
        </Stack>
        {/* Items */}
        {invoice.items.map((item, index) => (
          <Stack
            key={index}
            direction="row"
            alignItems="center"
            sx={{ p: 1.2, bgcolor: index % 2 === 0 ? 'transparent' : '#fafaf8', borderBottom: '1px solid #f0efeb' }}
          >
            <Typography sx={{ flex: 1, fontSize: '0.8rem', fontWeight: 600 }}>{item.description}</Typography>
            <Typography sx={{ width: 50, textAlign: 'center', fontSize: '0.8rem' }}>{item.quantity}</Typography>
            <Typography sx={{ width: 70, textAlign: 'center', fontSize: '0.8rem' }}>{formatCurrency(item.unitPrice)}</Typography>
            <Typography sx={{ width: 80, textAlign: 'left', fontSize: '0.8rem', fontWeight: 700 }}>{formatCurrency(item.total)}</Typography>
          </Stack>
        ))}
      </Box>

      {/* Totals */}
      <Stack alignItems="flex-end" sx={{ mb: 4 }}>
        <Box sx={{ width: { xs: '100%', sm: '50%' } }}>
          <Stack spacing={1}>
            <Stack direction="row" justifyContent="space-between">
              <Typography sx={{ color: '#666', fontSize: '0.8rem' }}>المجموع الفرعي</Typography>
              <Typography fontWeight={700} sx={{ fontSize: '0.8rem' }}>{formatCurrency(invoice.subtotal)}</Typography>
            </Stack>
            {invoice.taxAmount > 0 && (
              <Stack direction="row" justifyContent="space-between">
                <Typography sx={{ color: '#666', fontSize: '0.8rem' }}>الضريبة ({invoice.taxRate}%)</Typography>
                <Typography fontWeight={700} sx={{ fontSize: '0.8rem' }}>{formatCurrency(invoice.taxAmount)}</Typography>
              </Stack>
            )}
            <Divider sx={{ borderColor: '#4a5d4a' }} />
            <Stack direction="row" justifyContent="space-between">
              <Typography fontWeight={800} sx={{ color: '#4a5d4a', fontSize: '1rem' }}>الإجمالي</Typography>
              <Typography fontWeight={900} sx={{ color: '#4a5d4a', fontSize: '1.1rem' }}>{formatCurrency(invoice.total)}</Typography>
            </Stack>
          </Stack>
        </Box>
      </Stack>

      {/* Notes */}
      {invoice.notes && (
        <Box sx={{ p: 2, borderRight: '3px solid #c8c0b0', bgcolor: '#fffcf5', borderRadius: 1, mb: 3 }}>
          <Typography sx={{ color: '#8b7e6a', fontSize: '0.7rem', fontWeight: 700, mb: 0.5 }}>ملاحظات</Typography>
          <Typography sx={{ color: '#555', fontSize: '0.8rem' }}>{invoice.notes}</Typography>
        </Box>
      )}

      {/* Footer */}
      <Box sx={{ textAlign: 'center', mt: 'auto', pt: 2, borderTop: '1px solid #eee' }}>
        <Typography fontWeight={700} sx={{ color: primary, fontSize: '0.8rem' }}>
          {brand.fullName}
        </Typography>
        <Typography sx={{ color: '#888', fontSize: '0.65rem' }}>
          {contactLine}
        </Typography>
      </Box>
    </Box>
  );
});

PrintableInvoice.displayName = 'PrintableInvoice';
