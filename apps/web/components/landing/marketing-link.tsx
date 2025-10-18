"use client";

import type { ComponentPropsWithoutRef, MouseEvent } from "react";
import Link from "next/link";
import { recordMarketingEvent } from "@/lib/marketing-telemetry";

type MarketingLinkProps = ComponentPropsWithoutRef<typeof Link> & {
  eventName: string;
  metadata?: Record<string, string | number | boolean | null | undefined>;
};

export function MarketingLink({
  eventName,
  metadata,
  onClick,
  ...props
}: MarketingLinkProps) {
  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    if (onClick) {
      onClick(event);
    }
    if (!event.defaultPrevented) {
      recordMarketingEvent(eventName, metadata);
    }
  }

  return <Link {...props} onClick={handleClick} />;
}
