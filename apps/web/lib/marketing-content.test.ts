import {
  differentiators,
  operationsMockups,
  portalCapabilities,
  pricingTiers,
  processSteps,
  qaHighlights,
  serviceComparisons,
  socialLinks,
  testimonials,
  valuePillars,
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

  it("describe la oferta de valor y pilares", () => {
    expect(valuePillars.length).toBeGreaterThan(0);
    for (const pillar of valuePillars) {
      expect(pillar.title).toBeTruthy();
      expect(pillar.headline).toBeTruthy();
      expect(["function", "object"]).toContain(typeof pillar.icon);
    }
  });

  it("expone capacidades del portal con métricas", () => {
    expect(portalCapabilities.length).toBeGreaterThan(0);
    for (const capability of portalCapabilities) {
      expect(capability.title).toBeTruthy();
      expect(capability.statLabel).toBeTruthy();
      expect(capability.statValue).toBeTruthy();
    }
  });

  it("documenta los guardrails de QA", () => {
    expect(qaHighlights.length).toBeGreaterThan(0);
    for (const qa of qaHighlights) {
      expect(qa.title).toBeTruthy();
      expect(qa.proof).toBeTruthy();
    }
  });

  it("estructura la comparativa de servicios", () => {
    expect(serviceComparisons.length).toBeGreaterThan(0);
    for (const comparison of serviceComparisons) {
      expect(comparison.id).toBeTruthy();
      expect(comparison.deliverables.length).toBeGreaterThan(0);
      expect(comparison.sla).toBeTruthy();
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
