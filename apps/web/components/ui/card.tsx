import type { PropsWithChildren, ReactNode } from "react";

type CardProps = PropsWithChildren<{
  title?: ReactNode;
  description?: ReactNode;
  footer?: ReactNode;
  className?: string;
}>;

export function Card({
  title,
  description,
  footer,
  className = "",
  children,
}: CardProps) {
  return (
    <section
      className={`bg-brisa-800/60 rounded-xl border border-brisa-600/20 p-6 ${className}`}
    >
      {title ? (
        <header className="mb-4">
          <h2 className="text-xl font-semibold text-brisa-50 m-0">{title}</h2>
          {description ? (
            <p className="text-brisa-200 text-sm mt-2 m-0">{description}</p>
          ) : null}
        </header>
      ) : null}
      <div>{children}</div>
      {footer ? <footer className="mt-4">{footer}</footer> : null}
    </section>
  );
}
