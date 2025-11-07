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

export function locateBookingButton(
  calendarGrid: Locator,
  booking: {
    id: string;
    scheduledAt: string;
    service: { name: string };
  },
): Locator {
  return calendarGrid.locator(`[data-booking-id="${booking.id}"]`).first();
}
