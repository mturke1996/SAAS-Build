import { useEffect, useState } from 'react';
import {
  CheckCircle,
  Cancel,
  Refresh,
  CloudDone,
  CloudOff,
  InfoOutlined,
  RestartAlt,
  Bolt,
  SettingsBackupRestore,
} from '@mui/icons-material';
import { Button } from '../../design-system/primitives';
import { useBrand } from '../../config/BrandProvider';
import { useBrandStore } from '../../stores/useBrandStore';
import {
  getFirebaseStatus,
  testFirestoreRead,
  type FirebaseStatus,
  type TestResult,
} from '../../config/firebaseDiagnostics';

/**
 * FirebaseStatusPanel — live diagnostic card for the database connection.
 *
 *  - Shows the active source (env / brand / default)
 *  - Shows the projectId the SDK uses
 *  - "Test connection" button that actually reads from Firestore
 *  - Big "Reload to apply" CTA when the override differs from the initialized SDK
 */
export function FirebaseStatusPanel() {
  const brand = useBrand();
  const rtl = brand.direction === 'rtl';
  const resetFirebaseOverride = useBrandStore((s) => s.resetFirebaseOverride);
  const hasFirebaseOverride = useBrandStore((s) => !!(s.override as any)?.firebase);
  const [status, setStatus] = useState<FirebaseStatus>(() => getFirebaseStatus());
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);

  // Refresh status when brand store changes
  useEffect(() => {
    setStatus(getFirebaseStatus());
  }, [brand.firebase.apiKey, brand.firebase.projectId]);

  const runTest = async () => {
    setTesting(true);
    setResult(null);
    try {
      const r = await testFirestoreRead();
      setResult(r);
    } finally {
      setTesting(false);
    }
  };

  const sourceLabel = status.source === 'env'
    ? (rtl ? 'متغيرات البيئة (VITE_FIREBASE_*)' : 'Environment variables')
    : status.source === 'brand'
    ? (rtl ? 'إعدادات العلامة التجارية (مخزّنة محلياً)' : 'Brand override (localStorage)')
    : (rtl ? 'قيم افتراضية — غير متصل' : 'Default placeholders — not connected');

  const sourceTone =
    status.source === 'env' ? 'success' :
    status.source === 'brand' ? 'brand' :
    'danger';

  return (
    <div className="space-y-3">
      {/* Main status bar */}
      <div
        className="rounded-lg border p-3 sm:p-4 flex items-start gap-3"
        style={{
          borderColor: status.valid
            ? 'color-mix(in srgb, var(--brand-success) 32%, var(--surface-border))'
            : 'color-mix(in srgb, var(--brand-danger) 32%, var(--surface-border))',
          background: status.valid
            ? 'color-mix(in srgb, var(--brand-success) 6%, var(--surface-panel))'
            : 'color-mix(in srgb, var(--brand-danger) 6%, var(--surface-panel))',
        }}
      >
        <span
          className="h-10 w-10 rounded-md flex items-center justify-center shrink-0"
          style={{
            background: status.valid
              ? 'color-mix(in srgb, var(--brand-success) 16%, transparent)'
              : 'color-mix(in srgb, var(--brand-danger) 16%, transparent)',
            color: status.valid ? 'var(--brand-success)' : 'var(--brand-danger)',
          }}
          aria-hidden
        >
          {status.valid ? <CloudDone fontSize="small" /> : <CloudOff fontSize="small" />}
        </span>
        <div className="flex-1 min-w-0">
          <div
            className="text-[0.9375rem] font-bold"
            style={{ color: status.valid ? 'var(--brand-success)' : 'var(--brand-danger)' }}
          >
            {status.valid
              ? (rtl ? 'الاتصال مضبوط' : 'Connection configured')
              : (rtl ? 'غير متصل بقاعدة بيانات' : 'Not connected to a database')}
          </div>
          <div className="text-xs text-fg-subtle mt-0.5">
            {status.valid
              ? (rtl
                  ? `متصل بمشروع: ${status.projectId}`
                  : `Connected to project: ${status.projectId}`)
              : (rtl
                  ? 'الصق الإعدادات أدناه أو اضبط متغيرات البيئة.'
                  : 'Paste your config below or set env variables.')}
          </div>
        </div>
      </div>

      {/* Reload prompt — user pasted new config but SDK still uses old one */}
      {status.pendingReload && (
        <div
          role="alert"
          className="rounded-lg border p-3 sm:p-4 flex items-start gap-3"
          style={{
            borderColor: 'color-mix(in srgb, var(--brand-warning) 40%, transparent)',
            background: 'color-mix(in srgb, var(--brand-warning) 10%, transparent)',
          }}
        >
          <RestartAlt sx={{ fontSize: 22, color: 'var(--brand-warning)' }} className="shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold" style={{ color: 'var(--brand-warning)' }}>
              {rtl ? 'الإعدادات محفوظة — لم تُطبَّق بعد' : 'Config saved — not applied yet'}
            </div>
            <div className="text-xs text-fg-subtle mt-1 leading-relaxed">
              {rtl
                ? 'Firebase SDK يُهيَّأ مرّة واحدة عند تحميل الصفحة. أعد التحميل لتفعيل الاتصال الجديد.'
                : 'Firebase SDK initializes once at page load. Reload to activate the new connection.'}
            </div>
            <div className="mt-2">
              <Button
                size="sm"
                leftIcon={<RestartAlt sx={{ fontSize: 16 }} />}
                onClick={() => window.location.reload()}
              >
                {rtl ? 'إعادة تحميل الآن' : 'Reload now'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Details grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <StatusRow
          label={rtl ? 'مصدر الإعدادات' : 'Config source'}
          value={sourceLabel}
          tone={sourceTone}
          Icon={Bolt}
        />
        <StatusRow
          label={rtl ? 'معرّف المشروع' : 'Project ID'}
          value={status.projectId}
          mono
          Icon={InfoOutlined}
        />
        <StatusRow
          label={rtl ? 'نطاق المصادقة' : 'Auth domain'}
          value={status.authDomain}
          mono
          Icon={InfoOutlined}
        />
        <StatusRow
          label={rtl ? 'Firestore جاهز' : 'Firestore ready'}
          value={status.firestoreReady ? (rtl ? 'نعم' : 'Yes') : (rtl ? 'لا' : 'No')}
          tone={status.firestoreReady ? 'success' : 'danger'}
          Icon={status.firestoreReady ? CheckCircle : Cancel}
        />
      </div>

      {/* Test connection */}
      <div className="flex flex-wrap items-center gap-2 pt-2">
        <Button
          size="sm"
          variant="outline"
          loading={testing}
          leftIcon={!testing && <Refresh sx={{ fontSize: 16 }} />}
          onClick={runTest}
          disabled={!status.valid}
        >
          {testing
            ? (rtl ? 'جاري الاختبار…' : 'Testing…')
            : (rtl ? 'اختبار الاتصال' : 'Test connection')}
        </Button>

        {hasFirebaseOverride && (
          <Button
            size="sm"
            variant="ghost"
            leftIcon={<SettingsBackupRestore sx={{ fontSize: 16 }} />}
            onClick={() => {
              if (
                confirm(
                  rtl
                    ? 'سيتم حذف إعدادات Firebase المخصّصة والعودة إلى الإعدادات المبنيّة في الكود. أعِد التحميل بعدها لتطبيق التغيير.'
                    : 'This clears your custom Firebase override and falls back to the built-in config. Reload afterwards to apply.'
                )
              ) {
                resetFirebaseOverride();
              }
            }}
          >
            {rtl ? 'استعادة الإعدادات المبنيّة' : 'Restore built-in config'}
          </Button>
        )}

        {result && (
          <span
            className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-md text-xs font-semibold animate-fade-in"
            style={{
              background: result.ok
                ? 'color-mix(in srgb, var(--brand-success) 14%, transparent)'
                : 'color-mix(in srgb, var(--brand-danger) 14%, transparent)',
              color: result.ok ? 'var(--brand-success)' : 'var(--brand-danger)',
            }}
          >
            {result.ok ? <CheckCircle sx={{ fontSize: 14 }} /> : <Cancel sx={{ fontSize: 14 }} />}
            {renderTestMessage(result, rtl)}
          </span>
        )}
      </div>

      {!status.valid && (
        <p className="text-2xs text-fg-muted leading-relaxed">
          {rtl
            ? '💡 بعد لصق الإعدادات من Firebase Console واضغط "تحليل وحفظ"، أعد تحميل الصفحة لربط قاعدة البيانات.'
            : '💡 After pasting from Firebase Console and clicking "Parse & save", reload the page to connect.'}
        </p>
      )}
    </div>
  );
}

/** Format the test result as a short human string (helper for TS narrowing). */
function renderTestMessage(result: TestResult, rtl: boolean): string {
  if (result.ok) {
    return rtl
      ? `نجح القراءة من "${result.collection}" خلال ${result.durationMs}ms`
      : `Read "${result.collection}" in ${result.durationMs}ms`;
  }
  const detail = result.code || result.message;
  return rtl ? `فشل: ${detail}` : `Failed: ${detail}`;
}

function StatusRow({
  label,
  value,
  mono,
  tone,
  Icon,
}: {
  label: string;
  value: string;
  mono?: boolean;
  tone?: 'success' | 'danger' | 'brand';
  Icon: any;
}) {
  const toneColor = tone === 'success'
    ? 'var(--brand-success)'
    : tone === 'danger'
    ? 'var(--brand-danger)'
    : tone === 'brand'
    ? 'var(--brand-primary)'
    : 'var(--text-secondary)';

  return (
    <div className="flex items-center gap-2 h-10 px-3 rounded-md bg-surface-sunken border border-border">
      <Icon sx={{ fontSize: 14, color: toneColor }} />
      <span className="text-2xs font-semibold uppercase tracking-wider text-fg-muted shrink-0">{label}</span>
      <span
        className={`ms-auto text-xs font-semibold truncate min-w-0 ${mono ? 'font-mono' : ''}`}
        style={{ color: toneColor, direction: mono ? 'ltr' : undefined }}
        title={value}
      >
        {value}
      </span>
    </div>
  );
}
