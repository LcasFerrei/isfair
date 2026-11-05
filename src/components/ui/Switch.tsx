import { cn } from '../../lib/cn';

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}

export function Switch({ checked, onChange, label }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative h-7 w-12 shrink-0 self-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2',
        checked ? 'bg-fair' : 'bg-muted-2',
      )}
    >
      <span
        className={cn(
          'absolute start-0.5 top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform',
          checked && 'translate-x-5 rtl:-translate-x-5',
        )}
      />
    </button>
  );
}
