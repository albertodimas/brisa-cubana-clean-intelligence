import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MarketingLink } from "./marketing-link";

vi.mock("@/lib/marketing-telemetry", () => ({
  recordMarketingEvent: vi.fn(),
}));

describe("MarketingLink", () => {
  it("dispara evento de marketing al hacer clic", async () => {
    const { recordMarketingEvent } = await import("@/lib/marketing-telemetry");

    render(
      <MarketingLink href="#demo" eventName="cta_test" metadata={{ a: 1 }}>
        CTA Demo
      </MarketingLink>,
    );

    fireEvent.click(screen.getByRole("link", { name: "CTA Demo" }));

    expect(recordMarketingEvent).toHaveBeenCalledWith("cta_test", {
      a: 1,
    });
  });
});
