/**
 * PDF Service - Client-side PDF generation
 * Uses @react-pdf/renderer with Cairo Arabic font from gstatic CDN
 */
import React from 'react';
import { pdf } from '@react-pdf/renderer';
import toast from 'react-hot-toast';

export const generatePdfBlob = async (component: React.ReactElement): Promise<Blob> => {
  // Fix for react-pdf hanging on second generation: 
  // Initialize with false/null, then use updateContainer
  const asPdf = pdf();
  asPdf.updateContainer(component);
  const blob = await asPdf.toBlob();
  return blob;
};

export const downloadPdf = async (
  component: React.ReactElement,
  filename: string
): Promise<void> => {
  const toastId = toast.loading('جاري إنشاء ملف PDF...');
  try {
    const blob = await generatePdfBlob(component);
    const url = URL.createObjectURL(blob);

    // Always open in new tab — user can save/print from browser
    const tab = window.open(url, '_blank');
    if (!tab) {
      // Popup blocked — fallback to same window
      window.location.href = url;
    }
    // Keep URL alive for 2 minutes so the tab can load
    setTimeout(() => URL.revokeObjectURL(url), 120_000);

    toast.success('تم فتح PDF', { id: toastId });
  } catch (error: any) {
    console.error('PDF generation error:', error);
    toast.error('فشل في إنشاء PDF - تحقق من الاتصال بالإنترنت', { id: toastId });
    throw error;
  }
};

export const sharePdf = async (
  component: React.ReactElement,
  filename: string,
  title?: string
): Promise<void> => {
  const toastId = toast.loading('جاري تحضير الملف للمشاركة...');
  try {
    const blob = await generatePdfBlob(component);
    const file = new File([blob], `${filename}.pdf`, { type: 'application/pdf' });

    if (navigator.share && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], title: title || filename });
      toast.success('تمت المشاركة', { id: toastId });
    } else {
      // Fallback: download instead
      toast.dismiss(toastId);
      await downloadPdf(component, filename);
    }
  } catch (error: any) {
    if (error?.name === 'AbortError') {
      toast.dismiss(toastId);
      return;
    }
    console.error('Share PDF error:', error);
    toast.error('فشل في المشاركة', { id: toastId });
    throw error;
  }
};
