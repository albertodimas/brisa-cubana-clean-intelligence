import { chromium, type FullConfig } from "@playwright/test";
import {
  adminEmail,
  adminPassword,
  ADMIN_STORAGE_STATE_PATH,
} from "./support/auth";
import * as path from "path";
import * as fs from "fs";

async function globalSetup(config: FullConfig) {
  const baseURL = config.use?.baseURL ?? "http://localhost:3000";

  console.log("[globalSetup] Initializing authentication state...");
  console.log(`[globalSetup] Web URL: ${baseURL}`);

  // Ensure .auth directory exists
  const authDir = path.dirname(ADMIN_STORAGE_STATE_PATH);
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
    console.log(`[globalSetup] Created directory: ${authDir}`);
  }

  // Skip if auth state already exists and is recent (less than 1 hour old)
  if (fs.existsSync(ADMIN_STORAGE_STATE_PATH)) {
    const stats = fs.statSync(ADMIN_STORAGE_STATE_PATH);
    const ageMs = Date.now() - stats.mtimeMs;
    if (ageMs < 3600_000) {
      console.log(
        `[globalSetup] Auth state exists and is recent (${Math.round(ageMs / 1000)}s old), skipping setup`,
      );
      return;
    }
  }

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Navigate to login page
    console.log("[globalSetup] Navigating to /login...");
    await page.goto(`${baseURL}/login`, {
      waitUntil: "domcontentloaded",
      timeout: 30_000,
    });

    // Fill login form
    console.log(`[globalSetup] Logging in as ${adminEmail}...`);
    await page.getByLabel("Correo").fill(adminEmail);
    await page.getByLabel("Contraseña").fill(adminPassword);

    // Click login button and wait for navigation
    await Promise.all([
      page.waitForURL(
        (url) => {
          const { pathname } = new URL(url);
          return pathname === "/" || pathname === "";
        },
        { timeout: 30_000 },
      ),
      page.getByRole("button", { name: "Ingresar" }).click(),
    ]);

    // Wait for panel to be visible to ensure session is established
    await page.waitForSelector('text="Panel operativo"', { timeout: 15_000 });
    console.log("[globalSetup] Login successful, panel visible");

    // Save authentication state
    await context.storageState({ path: ADMIN_STORAGE_STATE_PATH });
    console.log(
      `[globalSetup] Saved authentication state to ${ADMIN_STORAGE_STATE_PATH}`,
    );
  } catch (error) {
    console.error("[globalSetup] Failed to setup authentication:", error);
    console.error(
      "[globalSetup] This is expected if web server is not yet ready",
    );
    console.error(
      "[globalSetup] Tests will handle authentication individually if needed",
    );
    // Don't throw - let tests handle auth if globalSetup fails
  } finally {
    await context.close();
    await browser.close();
  }
}

export default globalSetup;
