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
  className,
  children,
}: CardProps) {
  const classes = ["ui-card"];
  if (className) classes.push(className);

  return (
    <section className={classes.join(" ")}>
      {title ? (
        <header className="ui-card__header">
          <h2 className="ui-card__title">{title}</h2>
          {description ? (
            <p className="ui-card__description">{description}</p>
          ) : null}
        </header>
      ) : null}
      <div>{children}</div>
      {footer ? (
        <footer style={{ marginTop: "var(--spacing-sm)" }}>{footer}</footer>
      ) : null}
    </section>
  );
}
