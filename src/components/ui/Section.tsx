import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

export function PageTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div>
      <h2 className="text-[28px] font-bold leading-tight tracking-tight">{title}</h2>
      {subtitle && <p className="mt-1 text-ink-2">{subtitle}</p>}
    </div>
  );
}

interface SectionHeadingProps {
  title: string;
  eyebrow?: string;
  subtitle?: ReactNode;
  action?: ReactNode;
}

export function SectionHeading({ title, eyebrow, subtitle, action }: SectionHeadingProps) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3">
      <div>
        {eyebrow && <p className="text-sm text-ink-2">{eyebrow}</p>}
        <h3 className="text-xl font-bold tracking-tight">{title}</h3>
        {subtitle && <p className="mt-0.5 text-sm text-ink-2">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Divider() {
  return <hr className="my-7 border-line" />;
}

export function IconCircle({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn('grid h-10 w-10 shrink-0 place-items-center rounded-full bg-muted', className)}>
      {children}
    </span>
  );
}

interface ListRowProps {
  icon: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  trailing?: ReactNode;
  onClick?: () => void;
}

export function ListRow({ icon, title, subtitle, trailing, onClick }: ListRowProps) {
  const content = (
    <>
      {icon}
      <span className="min-w-0 flex-1 self-center">
        <span className="block font-semibold">{title}</span>
        {subtitle && <span className="mt-0.5 block text-sm text-ink-2">{subtitle}</span>}
      </span>
      {trailing}
    </>
  );
  const className = 'flex w-full items-start gap-4 py-3 text-start';
  return onClick ? (
    <button type="button" onClick={onClick} className={cn(className, '-mx-4 w-[calc(100%+2rem)] px-4 text-start active:bg-muted')}>
      {content}
    </button>
  ) : (
    <div className={className}>{content}</div>
  );
}
