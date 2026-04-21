import { cn } from './cn';
import { formatCurrency, formatCurrencyNumber } from '../../core/utils-formatters';

type Props = {
  amount: number;
  className?: string;
  suffixClassName?: string;
};

/**
 * مبلغ + «د.ل» داخل عزل LTR — للـ JSX عندما تحتاج تحكماً بالشكل (بديل بصري لـ formatCurrency()).
 */
export function CurrencyAmount({ amount, className, suffixClassName }: Props) {
  return (
    <span dir="ltr" className={cn('inline-flex items-baseline gap-1 font-num tabular-nums', className)}>
      <span className="[unicode-bidi:isolate]">{formatCurrencyNumber(amount)}</span>
      <span className={cn('shrink-0 font-semibold', suffixClassName)}>د.ل</span>
    </span>
  );
}

type MoneyProps = { amount: number; className?: string };

/** نفس منطق formatCurrency مع حاوية LTR للاستخدام السريع في JSX */
export function Money({ amount, className }: MoneyProps) {
  return (
    <span dir="ltr" className={cn('money-ltr font-num tabular', className)}>
      {formatCurrency(amount)}
    </span>
  );
}
