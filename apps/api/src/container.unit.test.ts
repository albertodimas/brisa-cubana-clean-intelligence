import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

let containerModule: typeof import("./container.js");
let container: (typeof import("./container.js"))["container"];
let ServiceKeys: (typeof import("./container.js"))["ServiceKeys"];

beforeAll(async () => {
  process.env.DATABASE_URL ??= "postgresql://user:pass@localhost:5432/test_db";
  process.env.JWT_SECRET ??= "test-secret";
  containerModule = await import("./container.js");
  ({ container, ServiceKeys } = containerModule);
});

describe("Container (Unit)", () => {
  beforeEach(() => {
    container.clear();
  });

  afterEach(() => {
    container.clear();
  });

  it("registers and resolves a service", () => {
    const testService = { name: "TestService" };
    container.register("test", () => testService);

    const resolved = container.resolve("test");
    expect(resolved).toBe(testService);
  });

  it("throws error when resolving non-existent service", () => {
    expect(() => container.resolve("nonexistent")).toThrow(
      "Service 'nonexistent' not found in container",
    );
  });

  it("checks if service exists with has()", () => {
    container.register("exists", () => ({ data: "test" }));

    expect(container.has("exists")).toBe(true);
    expect(container.has("notexists")).toBe(false);
  });

  it("clears all services", () => {
    container.register("service1", () => ({ data: "one" }));
    container.register("service2", () => ({ data: "two" }));

    expect(container.has("service1")).toBe(true);
    expect(container.has("service2")).toBe(true);

    container.clear();

    expect(container.has("service1")).toBe(false);
    expect(container.has("service2")).toBe(false);
  });

  it("maintains singleton pattern across calls", () => {
    const service = { counter: 0 };
    container.register("counter", () => service);

    const instance1 = container.resolve<{ counter: number }>("counter");
    const instance2 = container.resolve<{ counter: number }>("counter");

    instance1.counter = 42;

    expect(instance2.counter).toBe(42);
    expect(instance1).toBe(instance2);
  });

  it("defines correct service keys", () => {
    expect(ServiceKeys.PRISMA).toBe("prisma");
    expect(ServiceKeys.DATABASE_URL).toBe("databaseUrl");
    expect(ServiceKeys.SERVICE_REPOSITORY).toBe("serviceRepository");
    expect(ServiceKeys.BOOKING_REPOSITORY).toBe("bookingRepository");
    expect(ServiceKeys.PROPERTY_REPOSITORY).toBe("propertyRepository");
    expect(ServiceKeys.USER_REPOSITORY).toBe("userRepository");
    expect(ServiceKeys.CUSTOMER_REPOSITORY).toBe("customerRepository");
  });
});
