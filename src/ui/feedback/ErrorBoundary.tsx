import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from '../../design-system/primitives';

interface Props {
  children: ReactNode;
  /** Optional label for reset (wrapped by error UI) */
  rtl?: boolean;
}

interface State {
  hasError: boolean;
  message: string | null;
}

/**
 * Catches render errors in child tree; shows a recovery surface instead of a blank screen.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error?.message ?? null };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      const rtl = this.props.rtl ?? true;
      return (
        <div
          className="min-h-[50dvh] flex flex-col items-center justify-center gap-4 px-4 py-12 text-center"
          role="alert"
        >
          <div className="max-w-md rounded-2xl border border-[var(--surface-border)] bg-surface-panel p-6 shadow-md">
            <h1 className="text-lg font-extrabold text-fg font-arabic">
              {rtl ? 'حدث خطأ في العرض' : 'Something went wrong'}
            </h1>
            <p className="text-sm text-fg-subtle mt-2 font-arabic">
              {rtl
                ? 'يمكنك إعادة تحميل الصفحة أو العودة للرئيسية.'
                : 'Try reloading the page or go back home.'}
            </p>
            {this.state.message && import.meta.env.DEV && (
              <pre className="mt-3 text-left text-2xs text-fg-muted overflow-auto max-h-24 rounded-lg bg-surface-sunken p-2">
                {this.state.message}
              </pre>
            )}
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <Button
                variant="primary"
                onClick={() => {
                  this.setState({ hasError: false, message: null });
                  window.location.reload();
                }}
              >
                {rtl ? 'إعادة التحميل' : 'Reload'}
              </Button>
              <Button variant="outline" onClick={() => (window.location.href = '/')}>
                {rtl ? 'الرئيسية' : 'Home'}
              </Button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
