import {
  expect,
  type Locator,
  type Page,
  type TestInfo,
} from "@playwright/test";
import { loginAsAdmin } from "./auth";

const CALENDAR_TOUR_STORAGE_KEY = "onboarding-calendar-main-completed";

export function getCalendarGrid(page: Page): Locator {
  return page.getByTestId("panel-calendar-grid").first();
}

export async function ensureCalendarGridVisible(page: Page): Promise<Locator> {
  const grid = getCalendarGrid(page);
  await expect(grid).toBeVisible();
  return grid;
}

export async function openCalendarPage(
  page: Page,
  testInfo: TestInfo,
): Promise<Locator> {
  await loginAsAdmin(page, testInfo);
  await page.addInitScript((storageKey) => {
    try {
      window.localStorage.setItem(storageKey, "true");
    } catch (error) {
      console.warn("[e2e] failed to set calendar tour flag", error);
    }
  }, CALENDAR_TOUR_STORAGE_KEY);

  await page.goto("/panel/calendario");

  await page.evaluate((storageKey) => {
    try {
      window.localStorage.setItem(storageKey, "true");
    } catch (error) {
      console.warn("[e2e] post-nav calendar flag", error);
    }
  }, CALENDAR_TOUR_STORAGE_KEY);

  await page.reload();
  return ensureCalendarGridVisible(page);
}

export async function locateBookingButton(
  page: Page,
  calendarGrid: Locator,
  booking: {
    id: string;
    scheduledAt: string;
    service: { name: string };
  },
): Promise<Locator> {
  const bookingLocator = calendarGrid
    .locator(`[data-booking-id="${booking.id}"]`)
    .first();

  const revealBookingIfHidden = async () => {
    const dateKey = booking.scheduledAt.split("T")[0] ?? "";
    const targetCell = calendarGrid
      .locator(`[data-date-key="${dateKey}"]`)
      .first();
    try {
      await targetCell.scrollIntoViewIfNeeded();
    } catch {
      // Si la celda ya está visible no necesitamos hacer nada
    }

    const expandButton = targetCell
      .getByRole("button", { name: /\+\d+\sreservas/ })
      .first();
    if ((await expandButton.count()) > 0) {
      await expandButton.click();
      await page.waitForTimeout(100);
    }
  };

  try {
    await bookingLocator.waitFor({ state: "visible", timeout: 2000 });
    return bookingLocator;
  } catch {
    await revealBookingIfHidden();
    await bookingLocator.waitFor({ state: "visible", timeout: 8000 });
    return bookingLocator;
  }
}
