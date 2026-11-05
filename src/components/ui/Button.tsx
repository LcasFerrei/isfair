import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

type Variant = 'primary' | 'secondary' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

const variants: Record<Variant, string> = {
  primary: 'bg-ink text-white hover:bg-ink/90',
  secondary: 'bg-muted text-ink hover:bg-muted-2',
  ghost: 'text-ink hover:bg-muted',
};

const sizes: Record<Size, string> = {
  sm: 'h-9 px-4 text-sm rounded-full gap-1.5',
  md: 'h-12 px-4 text-base rounded-lg gap-2',
  lg: 'h-14 px-5 text-lg rounded-lg gap-2',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', type = 'button', ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(
        'inline-flex items-center justify-center font-semibold transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2',
        'disabled:pointer-events-none disabled:bg-muted disabled:text-ink-3',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  ),
);
Button.displayName = 'Button';
