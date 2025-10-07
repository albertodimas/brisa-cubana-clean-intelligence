import { describe, expect, it } from "vitest";
import HomePage from "./page";

describe("HomePage", () => {
  it("renders without crashing", () => {
    const component = HomePage();
    expect(component).toBeTruthy();
  });
});
