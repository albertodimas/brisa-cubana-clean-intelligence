import type { PropsWithChildren } from 'react';

export interface BadgeProps extends PropsWithChildren {
  tone?: 'teal' | 'sunset' | 'neutral';
  className?: string;
}

const toneTokens: Record<NonNullable<BadgeProps['tone']>, string> = {
  teal: 'border-teal-300/40 bg-teal-400/15 text-teal-100',
  sunset: 'border-rose-400/50 bg-rose-500/15 text-rose-100',
  neutral: 'border-white/20 bg-white/10 text-white'
};

export function Badge({ tone = 'teal', className = '', children }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] ${toneTokens[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
