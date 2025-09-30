import type { PropsWithChildren } from 'react';

export interface SectionProps extends PropsWithChildren {
  id?: string;
  eyebrow?: string;
  title: string;
  description?: string;
  align?: 'left' | 'center';
  className?: string;
}

export function Section({
  id,
  eyebrow,
  title,
  description,
  align = 'left',
  className = '',
  children
}: SectionProps) {
  const alignment = align === 'center' ? 'items-center text-center' : 'items-start text-left';

  return (
    <section id={id} className={`flex w-full flex-col gap-8 ${className}`}>
      <header className={`flex flex-col gap-3 ${alignment}`}>
        {eyebrow ? (
          <span className="uppercase tracking-[0.25em] text-xs font-semibold text-teal-200">{eyebrow}</span>
        ) : null}
        <h2 className="text-3xl font-semibold text-white sm:text-4xl">{title}</h2>
        {description ? <p className="max-w-2xl text-base text-neutral-300">{description}</p> : null}
      </header>
      {children}
    </section>
  );
}
