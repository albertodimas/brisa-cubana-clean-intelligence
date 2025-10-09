"use client";

import type { ButtonHTMLAttributes, PropsWithChildren } from "react";

type Variant = "primary" | "ghost";

type ButtonProps = PropsWithChildren<
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: Variant;
  }
>;

export function Button({
  variant = "primary",
  className,
  ...props
}: ButtonProps) {
  const classes = ["ui-button"];
  if (variant === "primary") {
    classes.push("ui-button--primary");
  }
  if (variant === "ghost") {
    classes.push("ui-button--ghost");
  }
  if (className) {
    classes.push(className);
  }

  return <button className={classes.join(" ")} {...props} />;
}
