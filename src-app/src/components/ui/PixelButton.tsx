import type { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';

interface PixelButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  children: ReactNode;
}

const VARIANT_BG: Record<ButtonVariant, string> = {
  primary:     'bg-[#dc2626]',
  secondary:   'bg-[#2563eb]',
  ghost:       'bg-transparent',
  destructive: 'bg-[#dc2626] opacity-80',
};

export function PixelButton({
  variant = 'primary',
  children,
  disabled,
  className = '',
  ...rest
}: PixelButtonProps) {
  const bg = VARIANT_BG[variant];

  return (
    <button
      disabled={disabled}
      className={[
        'font-pixel text-[10px] text-[#f0ead6]',
        'border-2 border-[#c8a96e]',
        'px-4 py-2 min-h-[44px]',
        'cursor-pointer',
        'shadow-[4px_4px_0px_#050805]',
        'hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_#050805]',
        'active:translate-x-0.5 active:translate-y-0.5 active:shadow-none',
        'transition-all duration-[120ms] ease-out',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-x-0 disabled:translate-y-0 disabled:shadow-[4px_4px_0px_#050805]',
        bg,
        className,
      ].join(' ')}
      {...rest}
    >
      {children}
    </button>
  );
}
