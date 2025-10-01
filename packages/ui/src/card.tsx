import type { PropsWithChildren, ReactNode } from "react";

export interface CardProps extends PropsWithChildren {
  title?: string;
  description?: string;
  icon?: ReactNode;
  bleed?: boolean;
  className?: string;
}

export function Card({
  title,
  description,
  icon,
  bleed = false,
  className = "",
  children,
}: CardProps) {
  return (
    <article
      className={`group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-lg shadow-black/30 backdrop-blur transition hover:border-white/20 hover:bg-white/[0.07] ${className}`}
    >
      <div
        className={`absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-0 transition group-hover:opacity-100 ${bleed ? "" : "pointer-events-none"}`}
      />
      <div className="relative flex flex-col gap-3">
        {icon ? <div className="text-2xl text-teal-200">{icon}</div> : null}
        {title ? (
          <h3 className="text-lg font-semibold text-white">{title}</h3>
        ) : null}
        {description ? (
          <p className="text-sm text-neutral-300">{description}</p>
        ) : null}
        {children}
      </div>
    </article>
  );
}
