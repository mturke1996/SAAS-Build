// @ts-nocheck
import { useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Button, Container, Stack, Typography, IconButton,
  Chip, Menu, MenuItem, CircularProgress, Dialog, DialogTitle,
  DialogContent, DialogContentText, DialogActions, alpha,
} from '@mui/material';
import {
  ArrowBack, Print, MoreVert, CheckCircle, Cancel, Email,
  Delete, PictureAsPdf, Share, Download, Edit
} from '@mui/icons-material';
import { useAuthStore } from '../../store/useAuthStore';
import { useDataStore } from '../../store/useDataStore';
import { PrintableInvoice } from '../../features/print/PrintableInvoice';
import { InvoicePDF } from '../../features/pdf/InvoicePDF';
import { downloadPdf, sharePdf } from '../../utils/pdfService';
import { getStatusLabel } from '../../utils/formatters';
import toast from 'react-hot-toast';
import React from 'react';

export const InvoiceDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { invoices, clients, updateInvoice, deleteInvoice } = useDataStore();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const invoice = invoices.find(inv => inv.id === id);
  const client = clients.find(c => c.id === invoice?.clientId) || 
    (invoice?.tempClientName ? { 
      id: 'temp', name: invoice.tempClientName, type: 'individual', 
      phone: invoice.tempClientPhone || '', address: invoice.tempClientAddress || '', 
      createdAt: '', updatedAt: '' 
    } as any : undefined);

  const componentRef = useRef<HTMLDivElement>(null);

  // ─── PDF Download ────────────────────────────────
  const handleDownloadPdf = async () => {
    if (!invoice || !client) return;
    setPdfLoading(true);
    try {
      await downloadPdf(
        React.createElement(InvoicePDF, { invoice, client }),
        `فاتورة-${invoice.invoiceNumber}`
      );
      toast.success('تم تحميل PDF بنجاح');
    } catch (err) {
      toast.error('فشل في إنشاء PDF');
    } finally {
      setPdfLoading(false);
    }
  };

  // ─── PDF Share (Mobile) ──────────────────────────
  const handleSharePdf = async () => {
    if (!invoice || !client) return;
    setPdfLoading(true);
    try {
      await sharePdf(
        React.createElement(InvoicePDF, { invoice, client }),
        `فاتورة-${invoice.invoiceNumber}`,
        `فاتورة #${invoice.invoiceNumber} - ${client.name}`
      );
    } catch (err) {
      toast.error('فشل في مشاركة PDF');
    } finally {
      setPdfLoading(false);
    }
  };

  // ─── Delete Invoice ──────────────────────────────
  const handleDelete = async () => {
    if (!invoice) return;
    setDeleting(true);
    try {
      await deleteInvoice(invoice.id);
      setDeleteDialogOpen(false);
      navigate('/invoices');
    } catch (err) {
      toast.error('فشل في حذف الفاتورة');
    } finally {
      setDeleting(false);
    }
  };

  if (!invoice || !client) {
    return <Box p={4} textAlign="center"><CircularProgress /></Box>;
  }

  const handleStatusChange = async (status: string) => {
    await updateInvoice(invoice.id, { status: status as any });
    setAnchorEl(null);
  };

  return (
    <Box sx={{
      pb: 4,
      '@media print': { bgcolor: 'white', pb: 0, minHeight: 'auto' },
    }}>
      {/* Header — minimal (aligned with invoice editor) */}
      <Box
        sx={{
          bgcolor: 'background.paper',
          borderBottom: 1,
          borderColor: 'divider',
          pt: 3, pb: 3, px: 2,
          '@media print': { display: 'none' },
        }}
      >
        <Container maxWidth="sm">
          <Stack direction="row" alignItems="center" spacing={1} mb={2}>
            <Box sx={{ flex: 1 }}>
              <Typography fontWeight={800} sx={{ fontSize: '1.1rem', color: 'text.primary' }}>
                فاتورة #{invoice.invoiceNumber}
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center">
                <Chip
                  label={getStatusLabel(invoice.status)}
                  color={invoice.status === 'paid' ? 'success' : invoice.status === 'overdue' ? 'error' : 'default'}
                  size="small"
                  sx={{ fontWeight: 600, borderRadius: 1.5, height: 22, fontSize: '0.65rem' }}
                />
              </Stack>
            </Box>
          </Stack>
          
          {/* Action Buttons */}
          <Stack direction="row" spacing={1}>
            <Button
              size="small"
              variant="outlined"
              color="primary"
              startIcon={pdfLoading ? <CircularProgress size={14} /> : <PictureAsPdf />}
              onClick={handleDownloadPdf}
              disabled={pdfLoading}
              sx={{
                borderRadius: 2,
                fontSize: '0.72rem',
                fontWeight: 700,
                flex: 1,
                textTransform: 'none',
              }}
            >
              تحميل PDF
            </Button>

            <Button
              size="small"
              variant="outlined"
              color="primary"
              startIcon={<Share />}
              onClick={handleSharePdf}
              disabled={pdfLoading}
              sx={{
                borderRadius: 2,
                fontSize: '0.72rem',
                fontWeight: 700,
                flex: 1,
                textTransform: 'none',
              }}
            >
              مشاركة
            </Button>

            <Button
              size="small"
              variant="outlined"
              color="inherit"
              endIcon={<MoreVert />}
              onClick={(e) => setAnchorEl(e.currentTarget)}
              sx={{
                borderRadius: 2,
                fontSize: '0.72rem',
                fontWeight: 700,
                flex: 1,
                textTransform: 'none',
                borderColor: 'divider',
              }}
            >
              إجراءات
            </Button>
          </Stack>

          {/* Actions Menu */}
          <Menu
            anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}
            PaperProps={{ sx: { borderRadius: 2, mt: 1, minWidth: 180 } }}
          >
            <MenuItem onClick={() => handleStatusChange('paid')} disabled={invoice.status === 'paid'}>
              <CheckCircle fontSize="small" color="success" sx={{ mr: 1 }} /> تم الدفع
            </MenuItem>
            <MenuItem onClick={() => handleStatusChange('sent')} disabled={invoice.status === 'sent'}>
              <Email fontSize="small" color="info" sx={{ mr: 1 }} /> تم الإرسال
            </MenuItem>
            <MenuItem onClick={() => handleStatusChange('cancelled')} disabled={invoice.status === 'cancelled'}>
              <Cancel fontSize="small" color="warning" sx={{ mr: 1 }} /> إلغاء
            </MenuItem>
            {user?.role === 'admin' && (
              <MenuItem onClick={() => navigate(`/invoices/new?edit=${invoice.id}`)}>
                <Edit fontSize="small" color="primary" sx={{ mr: 1 }} /> تعديل الفاتورة
              </MenuItem>
            )}
            <MenuItem
              onClick={() => {
                setAnchorEl(null);
                setDeleteDialogOpen(true);
              }}
              sx={{ color: 'error.main' }}
            >
              <Delete fontSize="small" sx={{ mr: 1, color: 'error.main' }} /> حذف الفاتورة
            </MenuItem>
          </Menu>
        </Container>
      </Box>

      {/* Printable Invoice Preview */}
      <Container 
        maxWidth="sm" 
        sx={{ 
          mt: 2, px: { xs: 0.5, sm: 2 },
          '@media print': { maxWidth: 'none', mt: 0, px: 0 },
        }}
      >
        <Box
          sx={{
            border: { xs: 'none', sm: '1px solid' },
            borderColor: 'divider',
            borderRadius: { xs: 0, sm: 2 },
            overflow: 'hidden',
            bgcolor: 'background.paper',
          }}
        >
          <PrintableInvoice ref={componentRef} invoice={invoice} client={client} />
        </Box>
      </Container>

      {/* ═══ Delete Confirmation Dialog ═══ */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        PaperProps={{
          sx: {
            borderRadius: 3,
            p: 1,
            maxWidth: 380,
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: 'error.main', fontSize: '1.1rem', pb: 0.5 }}>
          حذف الفاتورة
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontSize: '0.9rem', color: 'text.secondary' }}>
            هل أنت متأكد من حذف الفاتورة رقم <strong>#{invoice.invoiceNumber}</strong>؟
            <br />
            هذا الإجراء لا يمكن التراجع عنه.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            disabled={deleting}
            sx={{ borderRadius: 2, fontWeight: 700 }}
          >
            إلغاء
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDelete}
            disabled={deleting}
            startIcon={deleting ? <CircularProgress size={16} color="inherit" /> : <Delete />}
            sx={{
              borderRadius: 2,
              fontWeight: 800,
              px: 3,
              boxShadow: '0 4px 12px rgba(214,69,69,0.3)',
            }}
          >
            {deleting ? 'جاري الحذف...' : 'حذف'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
