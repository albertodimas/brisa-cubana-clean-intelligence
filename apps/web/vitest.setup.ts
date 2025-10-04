import "@testing-library/jest-dom";
import { vi } from "vitest";

// Mock global fetch
global.fetch = vi.fn() as unknown as typeof fetch;

// Mock window methods
global.alert = vi.fn();
global.confirm = vi.fn(() => true);
