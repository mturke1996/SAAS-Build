// @ts-nocheck
import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import './pdfFonts';
import { PDF_FONT_FAMILY } from './pdfFonts';
import type { Letter, LetterType } from '../../types';
import { getPdfBrand, buildFooterLine } from './pdfBrand';

/** Re-export for backwards compatibility with legacy callers. */
export type { Letter as LetterData, LetterType } from '../../types';

const typeLabelsAr: Record<LetterType, string> = {
  official: 'خطاب رسمي',
  offer: 'عرض سعر',
  entitlement: 'مستخلص',
};
const typeLabelsEn: Record<LetterType, string> = {
  official: 'LETTER',
  offer: 'OFFER',
  entitlement: 'STATEMENT',
};

const fmtDate = (d: string) => {
  try {
    const dt = new Date(d);
    return `${dt.getDate().toString().padStart(2, '0')}/${(dt.getMonth() + 1).toString().padStart(2, '0')}/${dt.getFullYear()}`;
  } catch {
    return d;
  }
};

interface Props {
  letter: Letter;
}

export const LetterPDF: React.FC<Props> = ({ letter }) => {
  const B = getPdfBrand();

  const s = StyleSheet.create({
    page: { fontFamily: PDF_FONT_FAMILY, fontSize: 10, color: B.palette.text, backgroundColor: '#fff', paddingVertical: 32, paddingHorizontal: 38 },

    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
    headerTitleBox: { textAlign: 'left', alignItems: 'flex-start' },
    letterLabel: { fontSize: 24, fontWeight: 'bold', color: '#e0dcd4', letterSpacing: 1, marginBottom: 2 },
    letterRef: { fontSize: 11, fontWeight: 'bold', color: B.palette.primary },
    headerCompanyBox: { flexDirection: 'row', alignItems: 'center' },
    companyTextBox: { justifyContent: 'center', alignItems: 'flex-end', marginRight: 12 },
    companyName: { fontSize: 13, fontWeight: 'bold', color: B.palette.primary, marginBottom: 2 },
    companySub: { fontSize: 9, fontWeight: 'bold', color: B.palette.accent },
    logo: { width: 50, height: 50, objectFit: 'contain', borderRadius: 8 },

    contactLine: { borderBottomWidth: 2, borderBottomColor: B.palette.primary, paddingBottom: 6, marginBottom: 24, alignItems: 'flex-end' },
    contactText: { fontSize: 9, fontWeight: 'bold', color: B.palette.muted },

    infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
    datesBox: { width: '35%' },
    dateRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    dateLabel: { fontSize: 9, color: '#999' },
    dateValue: { fontSize: 9, fontWeight: 'bold', color: B.palette.text },

    clientBox: { paddingVertical: 4, paddingRight: 10, borderRightWidth: 2, borderRightColor: B.palette.primary, width: '55%', alignItems: 'flex-end' },
    sectionLabel: { fontSize: 7.5, fontWeight: 'bold', color: B.palette.accent, marginBottom: 2 },
    clientName: { fontSize: 13, fontWeight: 'bold', color: '#2d3a2d', marginBottom: 2 },
    clientSub: { fontSize: 9, color: '#888', marginTop: 2 },

    subjectBar: { backgroundColor: B.palette.headerBg, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 3, marginBottom: 20 },
    subjectLabel: { fontSize: 7.5, color: '#c8c0b0', fontWeight: 'bold', marginBottom: 2, textAlign: 'right' },
    subjectText: { fontSize: 12, fontWeight: 'bold', color: '#fff', textAlign: 'right' },

    greeting: { fontSize: 11, fontWeight: 'bold', color: B.palette.text, textAlign: 'right', marginBottom: 14 },
    paragraph: { fontSize: 10.5, color: B.palette.text, lineHeight: 2, textAlign: 'right', marginBottom: 8 },

    notesBox: { padding: 12, backgroundColor: '#fffcf5', borderRightWidth: 3, borderRightColor: B.palette.accent, borderRadius: 3, marginTop: 16, alignItems: 'flex-end' },
    notesLabel: { fontSize: 9, fontWeight: 'bold', color: B.palette.accent, marginBottom: 4 },
    notesText: { fontSize: 10, color: '#555', textAlign: 'right', lineHeight: 1.7 },

    closingText: { fontSize: 10.5, color: B.palette.text, textAlign: 'right', marginTop: 16, marginBottom: 4 },
    closingBold: { fontSize: 11, fontWeight: 'bold', color: B.palette.text, textAlign: 'right', marginBottom: 24 },

    sigContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20, borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 16 },
    sigBlock: { width: '40%', alignItems: 'center' },
    sigLabel: { fontSize: 8.5, fontWeight: 'bold', color: B.palette.accent, marginBottom: 6, textAlign: 'center' },
    sigLine: { width: '100%', borderBottomWidth: 1, borderBottomColor: B.palette.border, height: 50, marginBottom: 6 },
    stampCircle: { width: 60, height: 60, borderRadius: 30, borderWidth: 1.5, borderColor: B.palette.border, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
    stampText: { fontSize: 7, color: '#aaa', textAlign: 'center' },
    sigName: { fontSize: 9, fontWeight: 'bold', color: B.palette.text, textAlign: 'center', marginTop: 4 },
    sigTitle: { fontSize: 8, color: B.palette.muted, textAlign: 'center' },

    footer: { position: 'absolute', bottom: 16, left: 38, right: 38, textAlign: 'center', borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 8 },
    footerTitle: { fontSize: 10, fontWeight: 'bold', color: B.palette.primary, marginBottom: 3 },
    footerText: { fontSize: 8, color: '#888' },
  });

  return (
    <Document title={typeLabelsAr[letter.type]} author={B.fullName} language="ar">
      <Page size="A4" style={s.page}>
        {/* HEADER */}
        <View style={s.header}>
          <View style={s.headerTitleBox}>
            <Text style={s.letterLabel}>{typeLabelsEn[letter.type]}</Text>
            <Text style={s.letterRef}>#{letter.refNumber}</Text>
          </View>
          <View style={s.headerCompanyBox}>
            <View style={s.companyTextBox}>
              <Text style={s.companyName}>{B.fullName}</Text>
              {B.tagline ? <Text style={s.companySub}>{B.tagline}</Text> : null}
            </View>
            {B.logoUrl ? <Image src={B.logoUrl} style={s.logo} /> : null}
          </View>
        </View>

        {/* CONTACT LINE */}
        <View style={s.contactLine}>
          <Text style={s.contactText}>{buildFooterLine(B)}</Text>
        </View>

        {/* RECIPIENT + DATE */}
        <View style={s.infoRow}>
          <View style={s.datesBox}>
            <View style={s.dateRow}>
              <Text style={s.dateValue}>{fmtDate(letter.date)}</Text>
              <Text style={s.dateLabel}>التاريخ</Text>
            </View>
            <View style={s.dateRow}>
              <Text style={s.dateValue}>{typeLabelsAr[letter.type]}</Text>
              <Text style={s.dateLabel}>النوع</Text>
            </View>
          </View>

          <View style={s.clientBox}>
            <Text style={s.sectionLabel}>إلى السيد / السادة</Text>
            <Text style={s.clientName}>{letter.recipientName}</Text>
            {letter.recipientTitle ? <Text style={s.clientSub}>{letter.recipientTitle}</Text> : null}
            {letter.recipientAddress ? <Text style={s.clientSub}>{letter.recipientAddress}</Text> : null}
            {letter.recipientPhone ? <Text style={s.clientSub}>{letter.recipientPhone}</Text> : null}
          </View>
        </View>

        {/* SUBJECT */}
        <View style={s.subjectBar}>
          <Text style={s.subjectLabel}>الموضوع</Text>
          <Text style={s.subjectText}>{letter.subject}</Text>
        </View>

        {/* GREETING */}
        {letter.greeting.split('\n').map((line, i, arr) => (
          <Text key={`g${i}`} style={[s.greeting, i < arr.length - 1 ? { marginBottom: 2 } : {}]}>{line}</Text>
        ))}

        {/* BODY */}
        {letter.bodyParagraphs.map((para, i) => (
          <Text key={i} style={s.paragraph}>{para}</Text>
        ))}

        {/* NOTES */}
        {letter.notes ? (
          <View style={s.notesBox}>
            <Text style={s.notesLabel}>ملاحظات</Text>
            <Text style={s.notesText}>{letter.notes}</Text>
          </View>
        ) : null}

        {/* CLOSING */}
        {letter.closing.split('\n').map((line, i) => (
          <Text key={`c${i}`} style={i === 0 ? s.closingText : s.closingBold}>{line}</Text>
        ))}

        {/* SIGNATURE & STAMP */}
        <View style={s.sigContainer}>
          {letter.showStamp ? (
            <View style={s.sigBlock}>
              <Text style={s.sigLabel}>الختم</Text>
              <View style={s.stampCircle}>
                <Text style={s.stampText}>مكان</Text>
                <Text style={s.stampText}>الختم الرسمي</Text>
              </View>
            </View>
          ) : null}
          <View style={s.sigBlock}>
            <Text style={s.sigLabel}>التوقيع</Text>
            <View style={s.sigLine} />
            <Text style={s.sigName}>{letter.signerName}</Text>
            <Text style={s.sigTitle}>{letter.signerTitle}</Text>
          </View>
        </View>

        {/* FOOTER */}
        <View style={s.footer} fixed>
          <Text style={s.footerTitle}>{B.fullName}</Text>
          <Text style={s.footerText}>{buildFooterLine(B)}</Text>
        </View>
      </Page>
    </Document>
  );
};
