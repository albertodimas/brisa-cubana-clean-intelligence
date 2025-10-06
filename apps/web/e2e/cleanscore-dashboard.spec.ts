import { test, expect } from "@playwright/test";
import { establishSession } from "./fixtures/session";

const ADMIN_EMAIL = "admin@brisacubanaclean.com";
const ADMIN_PASSWORD = "Admin123!";

test.describe("CleanScore dashboard", () => {
  // TODO: Fix synthetic data injection - tracked in issue #60
  test.skip("allows filtering and publishing CleanScore reports", async ({
    page,
    request,
  }) => {
    // Always use synthetic data in E2E tests with USE_FAKE_API_DATA=1
    const bookingId = `booking-e2e-${Date.now()}`;

    const issuedAt = new Date().toISOString();
    const reportsState: Array<{
      id: string;
      bookingId: string;
      status: "DRAFT" | "PUBLISHED";
      score: number;
      metrics: {
        generalCleanliness: number;
        kitchen: number;
        bathrooms: number;
        premiumDetails: number;
        ambiance: number;
        timeCompliance: number;
      };
      photos: Array<{
        url: string;
        caption: string;
        category: "before" | "after";
      }>;
      videos: string[];
      checklist: Array<{
        area: string;
        status: "PASS" | "WARN" | "FAIL";
        notes?: string;
      }>;
      observations: string;
      recommendations: string[];
      teamMembers: string[];
      generatedBy: string;
      sentToEmail: string | null;
      createdAt: string;
      updatedAt: string;
      booking: {
        id: string;
        status: string;
        scheduledAt: string;
        completedAt: string | null;
        property: { name: string; address: string };
        service: { name: string };
        user: { id: string; email: string; name: string };
      };
    }> = [
      {
        id: `cleanscore-${bookingId}`,
        bookingId,
        status: "DRAFT",
        score: 92,
        metrics: {
          generalCleanliness: 4.6,
          kitchen: 4.8,
          bathrooms: 4.7,
          premiumDetails: 4.5,
          ambiance: 4.4,
          timeCompliance: 4.9,
        },
        photos: [
          {
            url: "https://storage.mock/cleanscore/e2e-livingroom.jpg",
            caption: "Sala principal",
            category: "after",
          },
        ],
        videos: ["https://storage.mock/cleanscore/e2e-tour.mp4"],
        checklist: [
          { area: "Kitchen", status: "PASS" },
          { area: "Bathrooms", status: "PASS" },
          { area: "Final inspection", status: "PASS" },
        ],
        observations: "Reporte semilla para pruebas end-to-end",
        recommendations: ["Enviar recordatorio al cliente post-servicio"],
        teamMembers: ["Luz", "Camila"],
        generatedBy: "QA Bot",
        sentToEmail: null,
        createdAt: issuedAt,
        updatedAt: issuedAt,
        booking: {
          id: bookingId,
          status: "CONFIRMED",
          scheduledAt: issuedAt,
          completedAt: null,
          property: {
            name: "Brickell Luxury Apartment",
            address: "1234 Brickell Ave, Unit 2501",
          },
          service: {
            name: "Limpieza Profunda",
          },
          user: {
            id: "client-user",
            email: "client@brisacubanaclean.com",
            name: "Client Demo",
          },
        },
      },
    ];

    const patchCalls: Array<Record<string, unknown>> = [];

    await page.exposeBinding(
      "_recordCleanScorePatch",
      async (_source, payload) => {
        patchCalls.push(payload as unknown as Record<string, unknown>);
      },
    );

    await page.addInitScript(
      ({ reports, bookingId: injectedId }) => {
        const state = {
          list: reports,
        };
        (
          window as unknown as { __cleanScoreState__?: typeof state }
        ).__cleanScoreState__ = state;

        const originalFetch = window.fetch.bind(window);

        window.fetch = async (input, init = {}) => {
          const url =
            typeof input === "string"
              ? input
              : input instanceof URL
                ? input.toString()
                : (input?.url ?? "");
          const method = (init.method ?? "GET").toUpperCase();

          const matchesDetailEndpoint = (
            targetMethod: string,
            suffix: string,
          ) => method === targetMethod && url.includes(suffix);

          if (matchesDetailEndpoint("GET", "/api/reports/cleanscore?")) {
            return new Response(JSON.stringify({ reports: state.list }), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            });
          }

          if (
            matchesDetailEndpoint(
              "GET",
              `/api/reports/cleanscore/${injectedId}`,
            )
          ) {
            return new Response(JSON.stringify(state.list[0]), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            });
          }

          if (
            matchesDetailEndpoint(
              "PATCH",
              `/api/reports/cleanscore/${injectedId}`,
            )
          ) {
            const rawBody = init.body ?? "{}";
            const payload =
              typeof rawBody === "string"
                ? JSON.parse(rawBody)
                : (rawBody as unknown as Record<string, unknown>);

            await (
              window as unknown as {
                _recordCleanScorePatch?: (payload: unknown) => Promise<void>;
              }
            )._recordCleanScorePatch?.(payload);

            state.list[0] = {
              ...state.list[0],
              status: "PUBLISHED",
              updatedAt: new Date().toISOString(),
            };

            return new Response(
              JSON.stringify({
                success: true,
                status: "PUBLISHED",
                emailSent: true,
              }),
              {
                status: 200,
                headers: { "Content-Type": "application/json" },
              },
            );
          }

          return originalFetch(input, init);
        };
      },
      { reports: reportsState, bookingId },
    );

    await establishSession(page, request, {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    });

    await page.goto("/dashboard/reports/cleanscore");

    await expect(
      page.getByRole("heading", { level: 1, name: /CleanScore/ }),
    ).toBeVisible();

    // Verify test data is injected by checking for any draft reports
    await expect(page.getByTestId("status-filter")).toBeVisible();
    await page.getByTestId("status-filter").selectOption("draft");

    // Wait for reports to load
    await page.waitForLoadState("networkidle");

    // Look for any article cards (should have synthetic data)
    const anyCard = page.getByRole("article").first();
    await expect(anyCard).toBeVisible({ timeout: 10000 });

    // Now search for our specific booking
    await page.getByTestId("cleanscore-search").fill(bookingId);

    // Wait for filter to apply
    await page.waitForLoadState("networkidle");

    const card = () =>
      page.getByRole("article").filter({
        has: page.getByRole("heading", {
          level: 3,
          name: `Booking ${bookingId}`,
        }),
      });

    // Check if card exists before checking content
    await expect(card()).toBeVisible({ timeout: 10000 });
    await expect(card()).toContainText("Borrador");

    page.once("dialog", async (dialog) => {
      await dialog.accept();
    });

    await card().getByRole("button", { name: "Publicar y enviar" }).click();

    await expect.poll(() => patchCalls.length).toBe(1);

    await page.getByTestId("status-filter").selectOption("published");

    await expect(card()).toContainText("Publicado");
  });
});
