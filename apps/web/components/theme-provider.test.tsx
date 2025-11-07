import { render, screen, waitFor } from "@testing-library/react";
import { act } from "react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { ThemeProvider, useTheme } from "./theme-provider";

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

// Mock matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: query === "(prefers-color-scheme: dark)",
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }),
});

// Test component
function TestComponent() {
  const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme();

  return (
    <div>
      <div data-testid="theme">{theme}</div>
      <div data-testid="resolved-theme">{resolvedTheme}</div>
      <button onClick={() => setTheme("light")}>Set Light</button>
      <button onClick={() => setTheme("dark")}>Set Dark</button>
      <button onClick={() => setTheme("system")}>Set System</button>
      <button onClick={toggleTheme}>Toggle</button>
    </div>
  );
}

describe("ThemeProvider", () => {
  beforeEach(() => {
    localStorageMock.clear();
    document.documentElement.className = "";
  });

  it("should initialize with system theme by default", async () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("theme")).toHaveTextContent("system");
    });
  });

  it("should apply dark class when theme is dark", async () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>,
    );

    const setDarkButton = screen.getByText("Set Dark");
    await act(async () => {
      await userEvent.click(setDarkButton);
    });

    await waitFor(() => {
      expect(document.documentElement.classList.contains("dark")).toBe(true);
      expect(screen.getByTestId("theme")).toHaveTextContent("dark");
      expect(screen.getByTestId("resolved-theme")).toHaveTextContent("dark");
    });
  });

  it("should remove dark class when theme is light", async () => {
    document.documentElement.classList.add("dark");

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>,
    );

    const setLightButton = screen.getByText("Set Light");
    await act(async () => {
      await userEvent.click(setLightButton);
    });

    await waitFor(() => {
      expect(document.documentElement.classList.contains("dark")).toBe(false);
      expect(screen.getByTestId("theme")).toHaveTextContent("light");
      expect(screen.getByTestId("resolved-theme")).toHaveTextContent("light");
    });
  });

  it("should persist theme to localStorage", async () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>,
    );

    const setDarkButton = screen.getByText("Set Dark");
    await act(async () => {
      await userEvent.click(setDarkButton);
    });

    await waitFor(() => {
      expect(localStorageMock.getItem("brisa-theme-preference")).toBe("dark");
    });
  });

  it("should load theme from localStorage", async () => {
    localStorageMock.setItem("brisa-theme-preference", "light");

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("theme")).toHaveTextContent("light");
    });
  });

  it("should toggle between light and dark", async () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>,
    );

    // Set to dark first
    const setDarkButton = screen.getByText("Set Dark");
    await act(async () => {
      await userEvent.click(setDarkButton);
    });

    await waitFor(() => {
      expect(screen.getByTestId("resolved-theme")).toHaveTextContent("dark");
    });

    // Toggle should switch to light
    const toggleButton = screen.getByText("Toggle");
    await act(async () => {
      await userEvent.click(toggleButton);
    });

    await waitFor(() => {
      expect(screen.getByTestId("resolved-theme")).toHaveTextContent("light");
    });

    // Toggle again should switch back to dark
    await act(async () => {
      await userEvent.click(toggleButton);
    });

    await waitFor(() => {
      expect(screen.getByTestId("resolved-theme")).toHaveTextContent("dark");
    });
  });

  it("should migrate old theme key", async () => {
    localStorageMock.setItem("theme", "dark");

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("theme")).toHaveTextContent("dark");
    });

    // After setting a new theme, old key should be removed
    const setLightButton = screen.getByText("Set Light");
    await act(async () => {
      await userEvent.click(setLightButton);
    });

    await waitFor(() => {
      expect(localStorageMock.getItem("theme")).toBe(null);
      expect(localStorageMock.getItem("brisa-theme-preference")).toBe("light");
    });
  });

  it("should throw error when useTheme is used outside ThemeProvider", () => {
    // Suppress console.error for this test
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    expect(() => {
      render(<TestComponent />);
    }).toThrow("useTheme must be used within ThemeProvider");

    consoleError.mockRestore();
  });
});
