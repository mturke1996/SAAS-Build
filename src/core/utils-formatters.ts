import dayjs from 'dayjs';
import 'dayjs/locale/ar';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);
dayjs.locale('ar');

export const formatCurrency = (amount: number): string => {
  const rounded = Math.round(amount);
  return new Intl.NumberFormat('ar-LY', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(rounded) + ' د.ل';
};

export const formatDate = (date: string | Date, format: string = 'DD/MM/YYYY'): string => {
  return dayjs(date).format(format);
};

export const formatDateTime = (date: string | Date): string => {
  return dayjs(date).format('DD/MM/YYYY - hh:mm A');
};

export const formatRelativeDate = (date: string | Date): string => {
  return dayjs(date).fromNow();
};

export const formatPhoneNumber = (phone: string): string => {
  // Libyan phone format: 09X-XXXXXXX
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
  }
  return phone;
};

export const getStatusLabel = (status: string): string => {
  const statusMap: Record<string, string> = {
    draft: 'مسودة',
    sent: 'مرسلة',
    paid: 'مدفوعة',
    partially_paid: 'مدفوعة جزئياً',
    overdue: 'متأخرة',
    cancelled: 'ملغاة',
    unpaid: 'غير مدفوع',
    company: 'شركة',
    individual: 'فرد',
  };
  return statusMap[status] || status;
};

export const expenseCategories: Record<string, string> = {
  // --- التحضيرات والهيكل ---
  permits: 'تراخيص ورسوم حكومية',
  site_prep: 'تجهيز الموقع والمكاتب',
  surveying: 'أعمال مساحة وتخطيط',
  excavation: 'أعمال حفر وردم',
  concrete: 'خرسانة (جاهزة/مسلحة)',
  rebar: 'حديد تسليح',
  masonry: 'أعمال مباني (طوب/بلوك)',
  insulation: 'أعمال عزل (مائي/حراري)',

  // --- التشطيبات والديكور ---
  plaster: 'أعمال لياسة (محارة)',
  plumbing: 'تأسيس وتشطيب سباكة',
  electrical: 'تأسيس وتشطيب كهرباء',
  hvac: 'تكييف وتهوية (HVAC)',
  flooring: 'أرضيات (سيراميك/رخام)',
  painting: 'دهانات وديكورات',
  gypsum: 'جبس مبرد / أسقف معلقة',
  woodwork: 'أعمال نجارة (أبواب/ديكور)',
  aluminum_glass: 'ألومنيوم وواجهات زجاجية',
  iron_work: 'أعمال حديد ولحام',

  // --- الموارد والمعدات ---
  materials: 'توفير مواد خام متنوعة',
  labor: 'أجور عمالة ومصنعية',
  subcontractors: 'مستخلصات مقاولين باطن',
  equipment: 'إيجار معدات وسقالات',
  tools: 'شراء عدد وأدوات صغيرة',
  transport: 'نقل وتشوين',
  disposal: 'نقل مخلفات (ردم)',
  fuel: 'وقود وزيوت',

  // --- إدارية وعامة ---
  consulting: 'استشارات وإشراف هندسي',
  hospitality: 'ضيافة وإعاشة موقع',
  rent: 'إيجار سكن/مقر',
  utilities: 'فواتير (كهرباء/مياه/نت)',
  maintenance: 'صيانة معدات',
  other: 'مصروفات أخرى',
};

export const getExpenseCategoryLabel = (category: string): string => {
  return expenseCategories[category] || category;
};
