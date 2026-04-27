import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Close as CloseIcon,
  NotificationsNone,
  CheckCircle,
  Error as ErrorIcon,
  Info,
  WarningAmber,
  DeleteOutline,
  DoneAll,
  GetApp,
  PushPin,
} from '@mui/icons-material';
import { Drawer, IconButton, Divider, Button, Chip } from '@mui/material';
import { useShallow } from 'zustand/react/shallow';
import toast from 'react-hot-toast';
import { useNotificationStore, type InAppNotification } from '../../stores/useNotificationStore';
import { useNotificationPanelStore } from '../../stores/useNotificationPanelStore';
import { useBrand } from '../../config/BrandProvider';
import { cn } from '../../design-system/primitives/cn';
import { hasVapidConfigured, requestPushAndRegisterToken, getStoredFcmToken } from '../../core/push/fcmClient';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/ar';

dayjs.extend(relativeTime);

function typeIcon(t: InAppNotification['type'], size: 16 | 18 = 18) {
  const sx = { fontSize: size };
  switch (t) {
    case 'success':
      return <CheckCircle sx={sx} className="text-[var(--brand-success)]" />;
    case 'error':
      return <ErrorIcon sx={sx} className="text-[var(--brand-danger)]" />;
    case 'warning':
      return <WarningAmber sx={sx} className="text-[var(--brand-warning)]" />;
    default:
      return <Info sx={sx} className="text-[color:var(--brand-info)]" />;
  }
}

type BeforeInstallPrompt = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

/**
 * In-app + Web Push: drawer feed, PWA install (when the browser offers it), and FCM opt-in.
 */
export function NotificationPanel() {
  const open = useNotificationPanelStore((s) => s.open);
  const onClose = () => useNotificationPanelStore.getState().setOpen(false);
  const brand = useBrand();
  const rtl = brand.direction === 'rtl';
  const navigate = useNavigate();
  const { items, markRead, markAllRead, remove, clear } = useNotificationStore(
    useShallow((s) => ({
      items: s.items,
      markRead: s.markRead,
      markAllRead: s.markAllRead,
      remove: s.remove,
      clear: s.clear,
    }))
  );

  const [pwaInstall, setPwaInstall] = useState<BeforeInstallPrompt | null>(null);
  const [pushBusy, setPushBusy] = useState(false);
  const vapid = hasVapidConfigured();
  const fcmToken = getStoredFcmToken();

  useEffect(() => {
    const onBip = (e: Event) => {
      e.preventDefault();
      setPwaInstall(e as BeforeInstallPrompt);
    };
    window.addEventListener('beforeinstallprompt', onBip);
    return () => window.removeEventListener('beforeinstallprompt', onBip);
  }, []);

  const onInstallPwa = useCallback(async () => {
    if (!pwaInstall) return;
    try {
      await pwaInstall.prompt();
      setPwaInstall(null);
    } catch {
      setPwaInstall(null);
    }
  }, [pwaInstall]);

  const onEnablePush = useCallback(async () => {
    if (!vapid) {
      toast.error(rtl ? 'أضف VAPID في ملف البيئة (انظر .env.example)' : 'Add VAPID key to env');
      return;
    }
    setPushBusy(true);
    try {
      const r = await requestPushAndRegisterToken();
      if (r.ok === false) {
        if (r.reason === 'denied') {
          toast.error(rtl ? 'رُفض الإذن من المتصفح' : 'Notification permission denied');
        } else {
          toast.error(r.message || (rtl ? 'تعذر التفعيل' : 'Could not enable'));
        }
      } else {
        toast.success(rtl ? 'تم تفعيل إشعارات المتصفح' : 'Browser notifications enabled');
      }
    } finally {
      setPushBusy(false);
    }
  }, [rtl, vapid]);

  const relLocale = brand.locale?.startsWith('ar') ? 'ar' : 'en';
  if (relLocale === 'ar') {
    dayjs.locale('ar');
  } else {
    dayjs.locale('en');
  }

  const anchorSide = rtl ? 'left' : 'right';
  const unread = items.filter((i) => !i.read).length;

  return (
    <Drawer
      anchor={anchorSide}
      open={open}
      onClose={onClose}
      PaperProps={{
        className: 'h-full',
        sx: {
          width: 'min(100vw, 480px)',
          maxWidth: '100vw',
          height: '100%',
          maxHeight: '100dvh',
          background: 'var(--surface-canvas, #F3F1EC)',
          ...(anchorSide === 'right'
            ? {
                borderLeft: '1px solid var(--surface-border)',
                boxShadow: '-8px 0 24px rgba(0,0,0,0.08)',
              }
            : {
                borderRight: '1px solid var(--surface-border)',
                boxShadow: '8px 0 24px rgba(0,0,0,0.08)',
              }),
        },
      }}
    >
      <div
        className="flex h-full min-h-0 max-h-full flex-col"
        dir={rtl ? 'rtl' : 'ltr'}
        style={{
          paddingTop: 'max(0.5rem, env(safe-area-inset-top, 0px))',
          paddingBottom: 'max(0.25rem, env(safe-area-inset-bottom, 0px))',
        }}
      >
        <div
          className="shrink-0 border-b border-[var(--surface-border)] px-3 py-2.5"
          style={{
            background: 'color-mix(in srgb, var(--brand-primary) 6%, var(--surface-panel))',
            boxShadow: 'inset 0 -1px 0 color-mix(in srgb, var(--brand-primary) 8%, transparent)',
          }}
        >
          <div className="flex items-center justify-between gap-1.5">
            <div className="min-w-0">
              <h2 className="text-base font-extrabold leading-tight tracking-tight text-fg font-arabic">
                {rtl ? 'الإشعارات' : 'Notifications'}
              </h2>
              {unread > 0 && (
                <p className="text-2xs font-bold text-fg-muted font-arabic">
                  {rtl ? `${unread} غير مقروء` : `${unread} unread`}
                </p>
              )}
            </div>
            <div className="flex items-center gap-0">
              {items.length > 0 && (
                <IconButton
                  size="small"
                  aria-label={rtl ? 'تعليم الكل كمقروء' : 'Mark all read'}
                  onClick={() => markAllRead()}
                >
                  <DoneAll fontSize="small" />
                </IconButton>
              )}
              {items.length > 0 && (
                <Button
                  size="small"
                  color="inherit"
                  onClick={() => clear()}
                  className="!min-w-0 !px-2 !text-2xs"
                >
                  {rtl ? 'مسح' : 'Clear'}
                </Button>
              )}
              <IconButton size="small" aria-label={rtl ? 'إغلاق' : 'Close'} onClick={onClose}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </div>
          </div>
        </div>

        <div className="shrink-0 space-y-2 border-b border-border/80 bg-surface-sunken/40 p-3">
          <p className="px-0.5 text-2xs font-bold uppercase tracking-wider text-fg-subtle">
            {rtl ? 'تثبيت وويب' : 'PWA & web'}
          </p>
          {pwaInstall && (
            <button
              type="button"
              onClick={onInstallPwa}
              className="flex min-h-[52px] w-full items-center gap-2.5 rounded-xl border border-border bg-surface-panel px-3 py-2.5 text-start shadow-sm transition hover:border-[color:var(--brand-primary)]/35 active:scale-[0.99]"
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[color-mix(in_srgb,var(--brand-primary)_10%,transparent)] text-[color:var(--brand-primary)]">
                <GetApp sx={{ fontSize: 20 }} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-xs font-bold text-fg font-arabic">
                  {rtl ? 'تثبيت التطبيق' : 'Install app'}
                </span>
                <span className="text-2xs text-fg-muted font-arabic">
                  {rtl ? 'الشاشة الرئيسية — أسرع' : 'Home screen — faster access'}
                </span>
              </span>
            </button>
          )}
          {vapid && (
            <div className="flex flex-col gap-2 rounded-xl border border-border bg-surface-panel p-3">
              <div className="flex items-start gap-2">
                <PushPin
                  className="mt-0.5 shrink-0 text-[color:var(--brand-primary)]"
                  sx={{ fontSize: 20 }}
                />
                <div className="min-w-0 flex-1 text-start">
                  <p className="text-xs font-bold text-fg font-arabic">
                    {rtl ? 'إشعارات النظام (FCM)' : 'System notifications (FCM)'}
                  </p>
                  <p className="mt-0.5 text-2xs leading-relaxed text-fg-muted font-arabic">
                    {rtl
                      ? 'تنبيهات من السيرفر (يتطلب إذن المتصفح).'
                      : 'Server alerts; browser permission required.'}
                  </p>
                </div>
              </div>
              <Button
                fullWidth
                size="medium"
                variant="contained"
                disabled={pushBusy}
                onClick={onEnablePush}
                className="!min-h-12 !font-bold !font-arabic !normal-case !text-sm"
                sx={{ bgcolor: 'var(--brand-primary)', boxShadow: 'none' }}
              >
                {fcmToken
                  ? rtl
                    ? 'إعادة تفعيل / تحديث الجهاز'
                    : 'Refresh device'
                  : rtl
                    ? 'تفعيل إشعارات الويب'
                    : 'Enable web push'}
              </Button>
            </div>
          )}
          {!vapid && (
            <p className="text-2xs leading-relaxed text-amber-800/90 dark:text-amber-200/90 font-arabic">
              {rtl
                ? 'لتفعيل الإشعارات: عيّن VAPID في ملف البيئة (راجع ‎.env.example‎).'
                : 'To enable push: set VAPID in env (see .env.example).'}
            </p>
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 px-4 py-12 text-center text-fg-muted">
              <div
                className="grid h-16 w-16 place-items-center rounded-2xl border border-dashed border-border/90 bg-surface-panel/60"
                aria-hidden
              >
                <NotificationsNone sx={{ fontSize: 36, opacity: 0.4 }} />
              </div>
              <p className="text-base font-semibold text-fg font-arabic">
                {rtl ? 'لا توجد إشعارات حالياً' : 'You’re all caught up'}
              </p>
              <p className="text-xs max-w-[20rem] leading-relaxed text-fg-subtle font-arabic">
                {rtl
                  ? 'يُسجّل هنا نجاح العمليات والتنبيهات ورسائل FCM عند تفعيلها.'
                  : 'Activity, alerts, and FCM will appear here when enabled.'}
              </p>
            </div>
          ) : (
            <ul className="space-y-1.5" role="list">
              {items.map((n) => (
                <li key={n.id}>
                  <div
                    className={cn(
                      'flex items-stretch gap-0 overflow-hidden rounded-2xl border transition-colors',
                      n.read
                        ? 'border-transparent bg-surface-panel/50 opacity-90'
                        : 'border-[color-mix(in_srgb,var(--brand-primary)_18%,var(--surface-border))] bg-surface-panel shadow-sm'
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        markRead(n.id);
                        if (n.href) {
                          onClose();
                          navigate(n.href);
                        }
                      }}
                      className="min-w-0 flex-1 rounded-2xl px-3 py-2.5 text-start hover:bg-surface-sunken/50 focus:outline-none focus-visible:shadow-focus"
                    >
                      <div className="flex items-start gap-2">
                        <span className="shrink-0 pt-0.5" aria-hidden>
                          {typeIcon(n.type, 18)}
                        </span>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            {n.source === 'push' && (
                              <Chip
                                size="small"
                                label={rtl ? 'ويب' : 'Push'}
                                className="!h-5 !min-h-0 !text-[0.6rem] !font-bold"
                                variant="outlined"
                              />
                            )}
                            <div className="text-sm font-bold text-fg leading-snug font-arabic">{n.title}</div>
                          </div>
                          {n.body && (
                            <div className="mt-0.5 line-clamp-2 text-xs text-fg-subtle font-arabic">{n.body}</div>
                          )}
                          <div className="text-2xs text-fg-muted mt-1.5">
                            {dayjs(n.createdAt).fromNow()}
                          </div>
                        </div>
                      </div>
                    </button>
                    <IconButton
                      size="small"
                      aria-label={rtl ? 'حذف' : 'Remove'}
                      onClick={() => remove(n.id)}
                      className={cn('self-start min-h-12 min-w-12 rounded-none', rtl ? 'rounded-s-2xl' : 'rounded-e-2xl')}
                    >
                      <DeleteOutline sx={{ fontSize: 20 }} />
                    </IconButton>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        <Divider />
        <p className="shrink-0 px-3 py-2.5 text-center text-2xs leading-relaxed text-fg-subtle font-arabic">
          {rtl
            ? 'السجل مُحفوظ على هذا الجهاز — إشعارات FCM مرتبطة بمتصفحك بعد التفعيل.'
            : 'History is stored on this device; FCM links to this browser after opt-in.'}
        </p>
      </div>
    </Drawer>
  );
}
