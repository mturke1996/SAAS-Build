import { useRef, useEffect, useState, ChangeEvent } from 'react';
import { useBrandStore } from '../../stores/useBrandStore';
import { useBrand } from '../../config/BrandProvider';
import { Button, Input, Card } from '../../design-system/primitives';
import { cn } from '../../design-system/primitives/cn';
import { LogoMark } from '../brand/LogoMark';
import { pageIntro } from '../../core/motion/presets';
import {
  Restore,
  CheckCircle,
  CloudUpload,
  Download,
  Upload,
  ChevronRight,
  ExpandMore,
  Palette,
  Business,
  Contacts,
  Lock,
} from '@mui/icons-material';
import { hasValidFirebase } from '../../config/firebase';
import { AppLockSettingsDialog } from '../AppLockSettingsDialog';
import { useAppLockStore } from '../../stores/useAppLockStore';

/**
 * ============================================================================
 *  BrandingSettings — Live, mobile-first white-label editor
 * ============================================================================
 *  All changes persist to localStorage via useBrandStore and apply instantly.
 *
 *  Sections (collapsible on mobile):
 *    • Identity         — name, tagline, locale, direction
 *    • Logo             — URL OR upload (stored as data: URL)
 *    • Palette          — color pickers
 *    • Contact          — phone, email, website, address
 *    • Backup & restore — export/import entire config as JSON
 * ============================================================================
 */
export function BrandingSettingsPage() {
  const brand = useBrand();
  const { updateBrand, resetBrand, setBrand } = useBrandStore();
  const [saved, setSaved] = useState(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    identity: true,
    logo: true,
    palette: true,
    contact: false,
    backup: false,
    security: false,
  });
  const [appLockDialogOpen, setAppLockDialogOpen] = useState(false);
  const { isLocked, isAppLockReady } = useAppLockStore();
  const rtl = brand.direction === 'rtl';

  const wrapRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (wrapRef.current) pageIntro(wrapRef.current, '[data-reveal]');
  }, []);

  const flash = () => {
    setSaved(true);
    window.clearTimeout((flash as any)._t);
    (flash as any)._t = window.setTimeout(() => setSaved(false), 1200);
  };

  const toggle = (k: string) => setOpenSections((p) => ({ ...p, [k]: !p[k] }));

  // Logo upload (data URL)
  const handleLogoUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 1024 * 512) {
      alert(rtl ? 'حجم الملف كبير. الحد الأقصى 500KB.' : 'File too large. Max 500KB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      updateBrand({ logo: { src: dataUrl } });
      flash();
    };
    reader.readAsDataURL(f);
  };

  // Export full brand as JSON download
  const exportBrand = () => {
    const blob = new Blob([JSON.stringify(brand, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${brand.name || 'brand'}-config.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  // Import brand JSON
  const importRef = useRef<HTMLInputElement>(null);
  const importBrand = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const obj = JSON.parse(reader.result as string);
        setBrand(obj);
        flash();
      } catch {
        alert(rtl ? 'الملف غير صالح.' : 'Invalid file.');
      }
    };
    reader.readAsText(f);
  };

  return (
    <div ref={wrapRef} className="mx-auto max-w-3xl px-4 sm:px-6 py-5 lg:py-8 space-y-4 lg:space-y-5">
      {/* Header */}
      <header data-reveal className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <h1 className="text-xl sm:text-2xl font-bold text-fg tracking-tight">
            {rtl ? 'هوية العلامة التجارية' : 'Branding'}
          </h1>
          <p className="text-sm text-fg-subtle mt-1">
            {rtl
              ? 'خصص اسم التطبيق، الشعار، والألوان. كل تغيير يُطبَّق فوراً.'
              : 'Customize name, logo, and colors. Every change applies instantly.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {saved && (
            <span
              className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-md text-xs font-semibold animate-fade-in"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--brand-success) 14%, transparent)',
                color: 'var(--brand-success)',
              }}
            >
              <CheckCircle sx={{ fontSize: 14 }} /> {rtl ? 'حُفظ' : 'Saved'}
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Restore sx={{ fontSize: 16 }} />}
            onClick={() => {
              if (confirm(rtl ? 'استعادة الإعدادات الافتراضية؟' : 'Reset to defaults?')) {
                resetBrand();
                flash();
              }
            }}
          >
            {rtl ? 'افتراضي' : 'Reset'}
          </Button>
        </div>
      </header>

      {/* App lock — PIN + per-module access (Firestore settings/appLock) */}
      <SectionCard
        open={openSections.security}
        onToggle={() => toggle('security')}
        Icon={Lock}
        title={rtl ? 'قفل التطبيق والصلاحيات' : 'App lock & permissions'}
        subtitle={
          rtl
            ? 'رمز سري، أقسام متاحة بدون رمز، واستثناءات مستخدمين. يتطلب اتصال Firebase.'
            : 'PIN, guest-visible sections, and exempt users. Requires Firebase.'
        }
      >
        <div className="rounded-xl border border-border bg-surface-panel p-4 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                'inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full text-2xs font-bold',
                isAppLockReady && isLocked
                  ? 'bg-[color-mix(in_srgb,var(--brand-danger)_12%,transparent)] text-[color:var(--brand-danger)]'
                  : 'bg-[color-mix(in_srgb,var(--brand-success)_12%,transparent)] text-[color:var(--brand-success)]'
              )}
            >
              <Lock sx={{ fontSize: 14 }} />
              {isAppLockReady
                ? isLocked
                  ? rtl
                    ? 'القفل مفعّل'
                    : 'Lock enabled'
                  : rtl
                    ? 'لا يوجد رمز — كل الأقسام متاحة'
                    : 'No PIN — all sections open'
                : rtl
                  ? 'جاري تحميل إعدادات القفل…'
                  : 'Loading lock settings…'}
            </span>
          </div>
          <p className="text-sm text-fg-subtle leading-relaxed">
            {rtl
              ? 'فعّل رمزًا واختر الأقسام التي يراها الزائر بدون إدخال الرمز. يمكن استثناء مستخدمين بالكامل.'
              : 'Set a PIN and choose which sections guests see without it. You can exempt specific users.'}
          </p>
          <Button
            variant="primary"
            leftIcon={<Lock sx={{ fontSize: 18 }} />}
            onClick={() => setAppLockDialogOpen(true)}
            disabled={!hasValidFirebase}
          >
            {rtl ? 'إدارة الحماية والرمز السري' : 'Manage lock & PIN'}
          </Button>
          {!hasValidFirebase && (
            <p className="text-2xs text-fg-muted">
              {rtl ? 'اربط Firebase أولاً لحفظ إعدادات القفل في السحابة.' : 'Connect Firebase first to sync lock settings.'}
            </p>
          )}
        </div>
      </SectionCard>

      <AppLockSettingsDialog open={appLockDialogOpen} onClose={() => setAppLockDialogOpen(false)} />

      {/* Identity */}
      <SectionCard
        open={openSections.identity}
        onToggle={() => toggle('identity')}
        Icon={Business}
        title={rtl ? 'الهوية' : 'Identity'}
        subtitle={rtl ? 'الاسم، الشعار المختصر، والمنطقة' : 'Name, tagline, locale'}
      >
        <div className="flex items-center gap-3 mb-3 p-3 rounded-md bg-surface-sunken">
          <LogoMark size={48} />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold truncate">{brand.name}</div>
            <div className="text-2xs text-fg-muted truncate">{brand.fullName}</div>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label={rtl ? 'الاسم المختصر' : 'Short name'}
            value={brand.name}
            onChange={(e) => {
              updateBrand({ name: e.target.value });
              flash();
            }}
            placeholder={rtl ? 'تطبيقك' : 'Acme'}
          />
          <Input
            label={rtl ? 'الاسم الكامل' : 'Full name'}
            value={brand.fullName}
            onChange={(e) => {
              updateBrand({ fullName: e.target.value });
              flash();
            }}
            placeholder={rtl ? 'شركتك الكاملة' : 'Acme SaaS, Inc.'}
          />
          <div className="sm:col-span-2">
            <Input
              label={rtl ? 'شعار مختصر' : 'Tagline'}
              value={brand.tagline}
              onChange={(e) => {
                updateBrand({ tagline: e.target.value });
                flash();
              }}
              placeholder={rtl ? 'إدارة متكاملة • فواتير • عملاء' : 'Operations, simplified.'}
            />
          </div>
          <Input
            label={rtl ? 'الرمز المحلي' : 'Locale'}
            value={brand.locale}
            onChange={(e) => {
              updateBrand({ locale: e.target.value });
              flash();
            }}
            placeholder="ar-LY"
            hint={rtl ? 'ar-LY، en-US، fr-FR، …' : 'e.g. ar-LY, en-US, fr-FR'}
            dir="ltr"
          />
          <div>
            <label className="text-xs font-medium text-fg-subtle mb-1.5 block">
              {rtl ? 'اتجاه النص' : 'Direction'}
            </label>
            <div className="flex gap-2">
              {(['rtl', 'ltr'] as const).map((d) => (
                <Button
                  key={d}
                  size="sm"
                  variant={brand.direction === d ? 'primary' : 'outline'}
                  onClick={() => {
                    updateBrand({ direction: d });
                    flash();
                  }}
                >
                  {d.toUpperCase()}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Logo */}
      <SectionCard
        open={openSections.logo}
        onToggle={() => toggle('logo')}
        Icon={CloudUpload}
        title={rtl ? 'الشعار' : 'Logo'}
        subtitle={rtl ? 'ارفع صورة أو أدخل رابطاً' : 'Upload or paste URL'}
      >
        <div className="space-y-3">
          <label className="flex items-center justify-center gap-2 h-12 rounded-md border-2 border-dashed border-[var(--surface-border-strong)] bg-surface-sunken hover:border-[color:var(--brand-primary)] hover:bg-[color:var(--brand-primary-soft)] transition-colors duration-fast cursor-pointer">
            <CloudUpload sx={{ fontSize: 18 }} />
            <span className="text-sm font-medium">{rtl ? 'رفع صورة الشعار (PNG/SVG)' : 'Upload logo (PNG/SVG)'}</span>
            <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
          </label>
          <Input
            label={rtl ? 'رابط الشعار' : 'Logo URL'}
            value={brand.logo.src.startsWith('data:') ? '(uploaded image)' : brand.logo.src}
            onChange={(e) => {
              updateBrand({ logo: { src: e.target.value } });
              flash();
            }}
            placeholder="/brand/logo.svg"
            dir="ltr"
          />
          <Input
            label={rtl ? 'حرف احتياطي (عند فشل الصورة)' : 'Fallback letter'}
            maxLength={2}
            value={brand.logo.letter}
            onChange={(e) => {
              updateBrand({ logo: { letter: e.target.value.slice(0, 2) } });
              flash();
            }}
          />
        </div>
      </SectionCard>

      {/* Palette */}
      <SectionCard
        open={openSections.palette}
        onToggle={() => toggle('palette')}
        Icon={Palette}
        title={rtl ? 'الألوان' : 'Palette'}
        subtitle={rtl ? 'الألوان الدلالية للنظام' : 'Semantic colors'}
      >
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {(Object.keys(brand.palette) as Array<keyof typeof brand.palette>).map((key) => (
            <div key={key} className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-fg-subtle capitalize">{paletteLabel(key, rtl)}</label>
              <div className="flex items-center gap-2 h-10 px-2 rounded-md border border-border bg-surface-raised">
                <input
                  type="color"
                  value={brand.palette[key]}
                  onChange={(e) => {
                    updateBrand({ palette: { [key]: e.target.value } as any });
                    flash();
                  }}
                  className="h-7 w-9 rounded border border-border bg-transparent cursor-pointer p-0"
                  aria-label={paletteLabel(key, rtl)}
                />
                <input
                  type="text"
                  value={brand.palette[key]}
                  onChange={(e) => {
                    updateBrand({ palette: { [key]: e.target.value } as any });
                    flash();
                  }}
                  className="flex-1 bg-transparent outline-none font-mono text-xs text-fg min-w-0"
                  dir="ltr"
                />
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Contact */}
      <SectionCard
        open={openSections.contact}
        onToggle={() => toggle('contact')}
        Icon={Contacts}
        title={rtl ? 'معلومات التواصل' : 'Contact'}
        subtitle={rtl ? 'تظهر في الرأس والتذييل والمستندات' : 'Shown in headers, footers, documents'}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label={rtl ? 'الهاتف' : 'Phone'}
            value={brand.contact.phone || ''}
            onChange={(e) => {
              updateBrand({ contact: { phone: e.target.value } });
              flash();
            }}
            dir="ltr"
          />
          <Input
            label={rtl ? 'البريد الإلكتروني' : 'Email'}
            value={brand.contact.email || ''}
            onChange={(e) => {
              updateBrand({ contact: { email: e.target.value } });
              flash();
            }}
            dir="ltr"
          />
          <Input
            label={rtl ? 'الموقع الإلكتروني' : 'Website'}
            value={brand.contact.website || ''}
            onChange={(e) => {
              updateBrand({ contact: { website: e.target.value } });
              flash();
            }}
            dir="ltr"
          />
          <Input
            label={rtl ? 'العنوان' : 'Address'}
            value={brand.contact.address || ''}
            onChange={(e) => {
              updateBrand({ contact: { address: e.target.value } });
              flash();
            }}
          />
        </div>
      </SectionCard>

      {/* Backup & restore */}
      <SectionCard
        open={openSections.backup}
        onToggle={() => toggle('backup')}
        Icon={Download}
        title={rtl ? 'النسخ الاحتياطي' : 'Backup & restore'}
        subtitle={rtl ? 'تصدير واستيراد الإعدادات كاملةً' : 'Export / import full config'}
      >
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Download sx={{ fontSize: 16 }} />}
            onClick={exportBrand}
          >
            {rtl ? 'تصدير' : 'Export'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Upload sx={{ fontSize: 16 }} />}
            onClick={() => importRef.current?.click()}
          >
            {rtl ? 'استيراد' : 'Import'}
          </Button>
          <input ref={importRef} type="file" accept="application/json" className="hidden" onChange={importBrand} />
        </div>
      </SectionCard>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Collapsible section
// ────────────────────────────────────────────────────────────────────────────

interface SectionCardProps {
  open: boolean;
  onToggle: () => void;
  Icon: any;
  title: string;
  subtitle: string;
  highlight?: boolean;
  children: React.ReactNode;
}

function SectionCard({ open, onToggle, Icon, title, subtitle, highlight, children }: SectionCardProps) {
  return (
    <div
      data-reveal
      className={cn(
        'bg-surface-panel border rounded-lg overflow-hidden transition-colors duration-base',
        highlight ? 'border-[color:var(--brand-warning)]' : 'border-border'
      )}
    >
      <button
        onClick={onToggle}
        className={cn(
          'w-full flex items-center gap-3 p-3 sm:p-4 text-start cursor-pointer',
          'hover:bg-surface-hover transition-colors duration-fast',
          'focus:outline-none focus-visible:shadow-focus'
        )}
        aria-expanded={open}
      >
        <span
          className="h-9 w-9 shrink-0 rounded-md flex items-center justify-center"
          style={{
            background: highlight
              ? 'color-mix(in srgb, var(--brand-warning) 12%, transparent)'
              : 'var(--brand-primary-soft)',
            color: highlight ? 'var(--brand-warning)' : 'var(--brand-primary)',
          }}
        >
          <Icon sx={{ fontSize: 18 }} />
        </span>
        <div className="flex-1 min-w-0">
          <div className="text-[0.9375rem] font-semibold text-fg truncate">{title}</div>
          <div className="text-2xs text-fg-muted truncate">{subtitle}</div>
        </div>
        {open ? (
          <ExpandMore sx={{ fontSize: 20 }} className="text-fg-muted shrink-0" />
        ) : (
          <ChevronRight sx={{ fontSize: 20 }} className="text-fg-muted shrink-0 rtl-flip" />
        )}
      </button>
      {open && <div className="px-3 sm:px-4 pb-4 pt-1 border-t border-border">{children}</div>}
    </div>
  );
}

function paletteLabel(key: string, rtl: boolean): string {
  const m: Record<string, [string, string]> = {
    primary: ['Primary', 'أساسي'],
    secondary: ['Secondary', 'ثانوي'],
    success: ['Success', 'نجاح'],
    warning: ['Warning', 'تحذير'],
    danger: ['Danger', 'خطر'],
    info: ['Info', 'معلومة'],
  };
  return m[key] ? (rtl ? m[key][1] : m[key][0]) : key;
}
