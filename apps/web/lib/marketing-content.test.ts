import {
  differentiators,
  operationsMockups,
  pricingTiers,
  processSteps,
  socialLinks,
  testimonials,
} from "./marketing-content";

describe("marketing content", () => {
  it("includes testimonials with author and role", () => {
    expect(testimonials.length).toBeGreaterThan(0);
    for (const testimonial of testimonials) {
      expect(testimonial.quote).toBeTruthy();
      expect(testimonial.author).toBeTruthy();
      expect(testimonial.role).toBeTruthy();
    }
  });

  it("exposes differentiators with icons", () => {
    expect(differentiators.length).toBeGreaterThan(0);
    for (const diff of differentiators) {
      expect(diff.title).toBeTruthy();
      expect(diff.description).toBeTruthy();
      expect(["function", "object"]).toContain(typeof diff.icon);
    }
  });

  it("contains pricing tiers with features", () => {
    expect(pricingTiers.length).toBeGreaterThan(0);
    for (const tier of pricingTiers) {
      expect(tier.name).toBeTruthy();
      expect(tier.headline).toBeTruthy();
      expect(tier.features.length).toBeGreaterThan(0);
    }
  });

  it("lists operations mockups with assets", () => {
    expect(operationsMockups.length).toBeGreaterThan(0);
    for (const mockup of operationsMockups) {
      expect(mockup.src.startsWith("/assets/")).toBe(true);
      expect(mockup.placeholder.startsWith("/assets/")).toBe(true);
    }
  });

  it("defines process steps", () => {
    expect(processSteps.length).toBeGreaterThan(0);
    for (const step of processSteps) {
      expect(step.title).toBeTruthy();
      expect(step.description).toBeTruthy();
      expect(["function", "object"]).toContain(typeof step.icon);
    }
  });

  it("provides social links with urls", () => {
    expect(socialLinks.length).toBeGreaterThan(0);
    for (const link of socialLinks) {
      expect(link.name).toBeTruthy();
      expect(link.href.startsWith("https://")).toBe(true);
    }
  });
});
