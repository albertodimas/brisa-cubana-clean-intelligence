import { test, expect } from "@playwright/test";
import type { Dialog } from "@playwright/test";
import { API_BASE, establishSession } from "./fixtures/session";

const STAFF_EMAIL = "staff@brisacubanaclean.com";
const STAFF_PASSWORD = "Staff123!";

const staffBooking = {
  id: "booking-staff-1",
  scheduledAt: new Date().toISOString(),
  status: "CONFIRMED",
  totalPrice: 129.99,
  serviceName: "Limpieza Profunda",
  propertyName: "Skyline Loft",
  propertyAddress: "890 Biscayne Blvd",
  notes: "Revisar ventanas del balcón",
  clientName: "Cliente Demo",
  clientEmail: "client@example.com",
};

const staffBookingApiPayload = {
  id: staffBooking.id,
  scheduledAt: staffBooking.scheduledAt,
  status: staffBooking.status,
  totalPrice: staffBooking.totalPrice,
  notes: staffBooking.notes,
  service: { name: staffBooking.serviceName },
  property: {
    name: staffBooking.propertyName,
    address: staffBooking.propertyAddress,
  },
  user: {
    name: staffBooking.clientName,
    email: staffBooking.clientEmail,
  },
};

test.describe("Staff workspace", () => {
  test("permite iniciar y completar un servicio", async ({ page, request }) => {
    await establishSession(page, request, {
      email: STAFF_EMAIL,
      password: STAFF_PASSWORD,
    });

    const patchCalls: Array<Record<string, unknown>> = [];
    const reportCalls: Array<Record<string, unknown>> = [];

    await page.exposeFunction(
      "e2eRecordPatch",
      (payload: Record<string, unknown>) => {
        patchCalls.push(payload);
      },
    );

    await page.exposeFunction(
      "e2eRecordReport",
      (payload: Record<string, unknown>) => {
        reportCalls.push(payload);
      },
    );

    await page.addInitScript((booking) => {
      const originalFetch = window.fetch.bind(window);

      window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
        const url =
          typeof input === "string"
            ? input
            : input instanceof URL
              ? input.href
              : input.url;

        if (typeof url === "string" && url.includes("/api/bookings/mine")) {
          return new Response(JSON.stringify([booking]), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }

        if (
          typeof url === "string" &&
          url.includes(`/api/bookings/${booking.id}`) &&
          init?.method === "PATCH"
        ) {
          const bodyText =
            typeof init.body === "string"
              ? init.body
              : init.body instanceof URLSearchParams
                ? init.body.toString()
                : init?.body
                  ? JSON.stringify(init.body)
                  : "{}";

          const parsedBody = JSON.parse(bodyText) as Record<string, unknown>;
          window.e2eRecordPatch?.(parsedBody);

          return new Response(
            JSON.stringify({
              ...booking,
              status:
                typeof parsedBody.status === "string"
                  ? parsedBody.status
                  : booking.status,
            }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            },
          );
        }

        if (
          typeof url === "string" &&
          url.includes("/api/reports/cleanscore") &&
          init?.method === "POST"
        ) {
          const bodyText =
            typeof init.body === "string"
              ? init.body
              : init.body instanceof URLSearchParams
                ? init.body.toString()
                : init?.body
                  ? JSON.stringify(init.body)
                  : "{}";

          const parsedBody = JSON.parse(bodyText) as Record<string, unknown>;
          window.e2eRecordReport?.(parsedBody);

          return new Response(
            JSON.stringify({
              success: true,
              message: "CleanScore report generated",
            }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            },
          );
        }

        return originalFetch(input, init);
      };
    }, staffBookingApiPayload);

    const handleDialog = async (dialog: Dialog) => {
      await dialog.accept();
    };
    page.on("dialog", handleDialog);

    await page.goto("/staff");

    const card = page.getByRole("button", { name: staffBooking.serviceName });
    await expect(card).toBeVisible();

    await card.click();

    await expect(
      page.getByText(/Servicio activo/, { exact: false }),
    ).toBeVisible();

    await page.getByRole("button", { name: /Iniciar servicio/i }).click();

    await waitForStatus(patchCalls, "IN_PROGRESS");

    const checklistLabels = [
      "Verificar acceso a la propiedad",
      "Inspección visual inicial",
      "Limpieza de pisos y superficies",
      "Limpieza de baños",
      "Limpieza de cocina",
      "Aspirado y trapeado final",
      "Retirar basura",
      "Inspección final de calidad",
    ];

    for (const label of checklistLabels) {
      await page.getByRole("button", { name: label }).click();
    }

    await page.getByRole("button", { name: /Completar servicio/i }).click();

    await waitForStatus(patchCalls, "COMPLETED");

    await waitForReport(reportCalls, staffBooking.id);

    await expect(
      page.getByText(/¡Todo completado!/, { exact: false }),
    ).toBeVisible();

    page.off("dialog", handleDialog);
  });
});

async function waitForStatus(
  calls: Array<Record<string, unknown>>,
  expectedStatus: string,
) {
  await expect
    .poll(() => calls.some((call) => call.status === expectedStatus))
    .toBe(true);
}

async function waitForReport(
  calls: Array<Record<string, unknown>>,
  bookingId: string,
) {
  await expect
    .poll(() =>
      calls.some((call) => {
        return (
          typeof call.bookingId === "string" &&
          call.bookingId === bookingId &&
          Array.isArray(call.images)
        );
      }),
    )
    .toBe(true);
}
