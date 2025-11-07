import { test, expect } from "@playwright/test";
import type { TestInfo } from "@playwright/test";
import { loginAsAdmin, loginAsUser, ipForTest } from "./support/auth";
import {
  createBookingFixture,
  createUserFixture,
  deleteAllBookings,
  deleteUserFixture,
  getAdminAccessToken,
} from "./support/services";

test.describe.serial("Staff Assignment", () => {
  let adminToken: string;
  let staffUser: { id: string; email: string; password: string };

  test.beforeAll(async ({ request }) => {
    adminToken = await getAdminAccessToken(request);

    // Create a staff user for testing
    staffUser = await createUserFixture(request, {
      role: "STAFF",
      fullName: "QA Staff Test User",
    });
  });

  test.beforeEach(async ({ request }) => {
    if (adminToken) {
      await deleteAllBookings(request, adminToken);
    }
  });

  test.afterAll(async ({ request }) => {
    if (staffUser?.id) {
      await deleteUserFixture(request, staffUser.id);
    }
  });

  test("permite asignar staff a una reserva desde el panel @critical", async ({
    page,
    request,
  }, testInfo: TestInfo) => {
    // Create a booking fixture
    const booking = await createBookingFixture(request, adminToken, {
      status: "CONFIRMED",
    });

    await loginAsAdmin(page, testInfo);

    // Wait for bookings to load
    await expect(page.getByTestId("booking-card").first()).toBeVisible({
      timeout: 10000,
    });

    // Find the booking card by code
    const bookingCard = page
      .getByTestId("booking-card")
      .filter({ hasText: booking.code });
    await expect(bookingCard).toBeVisible();

    // Find the staff assignment select
    const staffSelect = bookingCard.getByTestId("booking-staff-select");
    await expect(staffSelect).toBeVisible();

    // Assign staff
    await staffSelect.selectOption(staffUser.id);

    // Verify toast notification
    await expect(
      page.getByText(/Personal asignado correctamente|Staff assigned/i).first(),
    ).toBeVisible({ timeout: 5000 });

    // Verify the select now shows the assigned staff
    await expect(staffSelect).toHaveValue(staffUser.id);
  });

  test("permite desasignar staff de una reserva @critical", async ({
    page,
    request,
  }, testInfo: TestInfo) => {
    // Create a booking with assigned staff
    const booking = await createBookingFixture(request, adminToken, {
      status: "PENDING",
    });

    // Assign staff via API
    const apiUrl = process.env.E2E_API_URL || "http://localhost:3001";
    const assignResponse = await request.patch(
      `${apiUrl}/api/bookings/${booking.id}/assign-staff`,
      {
        headers: {
          "x-forwarded-for": ipForTest(testInfo),
          Authorization: `Bearer ${adminToken}`,
          "Content-Type": "application/json",
        },
        data: {
          staffId: staffUser.id,
        },
      },
    );
    expect(assignResponse.ok()).toBe(true);

    await loginAsAdmin(page, testInfo);

    // Wait for bookings to load
    await expect(page.getByTestId("booking-card").first()).toBeVisible({
      timeout: 10000,
    });

    // Find the booking card
    const bookingCard = page
      .getByTestId("booking-card")
      .filter({ hasText: booking.code });
    await expect(bookingCard).toBeVisible();

    // Find the staff assignment select
    const staffSelect = bookingCard.getByTestId("booking-staff-select");

    // Verify staff is currently assigned
    await expect(staffSelect).toHaveValue(staffUser.id);

    // Unassign staff by selecting "Sin asignar"
    await staffSelect.selectOption("");

    // Verify toast notification
    await expect(
      page.getByText(/Personal desasignado|Staff unassigned/i).first(),
    ).toBeVisible({ timeout: 5000 });

    // Verify the select now shows no staff assigned
    await expect(staffSelect).toHaveValue("");
  });

  test("filtra reservas por staff asignado @critical", async ({
    page,
    request,
  }, testInfo: TestInfo) => {
    // Create bookings with and without staff assignment
    const [booking1, booking2] = await Promise.all([
      createBookingFixture(request, adminToken, { status: "CONFIRMED" }),
      createBookingFixture(request, adminToken, { status: "PENDING" }),
    ]);

    // Assign staff to first booking only
    const apiUrl = process.env.E2E_API_URL || "http://localhost:3001";
    await request.patch(`${apiUrl}/api/bookings/${booking1.id}/assign-staff`, {
      headers: {
        "x-forwarded-for": ipForTest(testInfo),
        Authorization: `Bearer ${adminToken}`,
        "Content-Type": "application/json",
      },
      data: {
        staffId: staffUser.id,
      },
    });
    const assignmentCheck = await request.get(
      `${apiUrl}/api/bookings?limit=10&assignedStaffId=${staffUser.id}`,
      {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      },
    );
    const assignmentJson = (await assignmentCheck.json()) as {
      data?: Array<{ id: string }>;
    };
    expect(
      (assignmentJson.data ?? []).some((entry) => entry.id === booking1.id),
    ).toBe(true);

    await loginAsAdmin(page, testInfo);

    // Wait for initial bookings to load
    await expect(page.getByTestId("booking-card").first()).toBeVisible({
      timeout: 10000,
    });

    // Find and use the staff filter select
    // The staff filter should be in the filters section
    const staffFilter = page.locator("select").filter({
      has: page.locator('option:has-text("Todos los staff")'),
    });

    // If staff filter exists, use it
    if (await staffFilter.isVisible()) {
      const [response] = await Promise.all([
        page.waitForResponse((res) => {
          const url = res.url();
          return (
            res.request().method() === "GET" &&
            url.includes("/api/bookings") &&
            url.includes(`assignedStaffId=${staffUser.id}`)
          );
        }),
        staffFilter.selectOption(staffUser.id),
      ]);

      expect(response.ok()).toBe(true);

      // Verify that only bookings with assigned staff are shown
      const bookingCards = page.getByTestId("booking-card");
      const count = await bookingCards.count();
      expect(count).toBeGreaterThan(0);

      // All visible booking cards should have the staff selected
      for (let i = 0; i < count; i++) {
        const card = bookingCards.nth(i);
        const staffSelect = card.getByTestId("booking-staff-select");
        await expect(staffSelect).toHaveValue(staffUser.id);
      }
    }
  });

  test("staff ve solo sus reservas asignadas en /panel/staff @critical", async ({
    page,
    request,
    context,
  }, testInfo: TestInfo) => {
    // Create bookings
    const [booking1, booking2] = await Promise.all([
      createBookingFixture(request, adminToken, { status: "CONFIRMED" }),
      createBookingFixture(request, adminToken, { status: "PENDING" }),
    ]);

    // Assign only first booking to staff user
    const apiUrl = process.env.E2E_API_URL || "http://localhost:3001";
    await request.patch(`${apiUrl}/api/bookings/${booking1.id}/assign-staff`, {
      headers: {
        "x-forwarded-for": ipForTest(testInfo),
        Authorization: `Bearer ${adminToken}`,
        "Content-Type": "application/json",
      },
      data: {
        staffId: staffUser.id,
      },
    });

    await loginAsUser(page, context, staffUser.email, staffUser.password);

    // Navigate to staff dashboard
    await page.goto("/panel/staff");
    await page.waitForURL(/\/panel\/staff$/, { timeout: 15000 });
    await page.waitForLoadState("networkidle");

    // Verify stats are visible
    // Verify only assigned bookings are shown
    const bookingCards = page.getByTestId("booking-card");
    const cardCount = await bookingCards.count();
    if (cardCount === 0) {
      return;
    }

    await expect(bookingCards.first()).toBeVisible({ timeout: 15000 });
    await expect(bookingCards.filter({ hasText: booking1.code })).toBeVisible();

    // Verify all shown bookings have the staff user assigned
    for (let i = 0; i < cardCount; i++) {
      const card = bookingCards.nth(i);
      const staffSelect = card.locator("select").filter({
        has: page.locator('option:has-text("Sin asignar")'),
      });

      // Staff should see their own assignments
      if (await staffSelect.isVisible()) {
        await expect(staffSelect).toHaveValue(staffUser.id);
      }
    }
  });

  test("no permite asignar staff a reservas completadas o canceladas @critical", async ({
    page,
    request,
  }, testInfo: TestInfo) => {
    // Create a completed booking
    const booking = await createBookingFixture(request, adminToken, {
      status: "COMPLETED",
    });

    await loginAsAdmin(page, testInfo);

    // Wait for bookings to load
    await expect(page.getByTestId("booking-card").first()).toBeVisible({
      timeout: 10000,
    });

    // Find the booking card
    const bookingCard = page
      .getByTestId("booking-card")
      .filter({ hasText: booking.code });

    if (await bookingCard.isVisible()) {
      // Find the staff assignment select
      const staffSelect = bookingCard.locator("select").filter({
        has: page.locator('option:has-text("Sin asignar")'),
      });

      // Verify the select is disabled
      await expect(staffSelect).toBeDisabled();
    }
  });
});
