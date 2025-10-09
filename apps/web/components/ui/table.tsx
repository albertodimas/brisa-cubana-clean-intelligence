import type { PropsWithChildren } from "react";

type TableProps = PropsWithChildren<{ className?: string }>;

export function Table({ className, children }: TableProps) {
  const classes = ["ui-table"];
  if (className) classes.push(className);
  return <table className={classes.join(" ")}>{children}</table>;
}

type TableHeadProps = PropsWithChildren;

export function TableHead({ children }: TableHeadProps) {
  return <thead>{children}</thead>;
}

type TableRowProps = PropsWithChildren;

export function TableRow({ children }: TableRowProps) {
  return <tr>{children}</tr>;
}

type TableHeaderProps = PropsWithChildren<{
  align?: "left" | "center" | "right";
}>;

export function TableHeader({ children, align = "left" }: TableHeaderProps) {
  return <th style={{ textAlign: align }}>{children}</th>;
}

type TableBodyProps = PropsWithChildren;

export function TableBody({ children }: TableBodyProps) {
  return <tbody>{children}</tbody>;
}

type TableCellProps = PropsWithChildren<{
  align?: "left" | "center" | "right";
}>;

export function TableCell({ children, align = "left" }: TableCellProps) {
  return (
    <td style={{ textAlign: align, verticalAlign: "middle" }}>{children}</td>
  );
}
