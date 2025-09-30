import puppeteer from "puppeteer";
import { logger } from "../lib/logger";

interface GeneratePDFOptions {
  html: string;
  format?: "A4" | "Letter";
  landscape?: boolean;
}

/**
 * Generate PDF from HTML using Puppeteer
 */
export async function generatePDF({
  html,
  format = "A4",
  landscape = false,
}: GeneratePDFOptions): Promise<Buffer> {
  let browser;

  try {
    logger.info("Launching Puppeteer browser for PDF generation");

    browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
      ],
    });

    const page = await browser.newPage();

    // Set content with timeout
    await page.setContent(html, {
      waitUntil: "networkidle0",
      timeout: 30000,
    });

    logger.info("Generating PDF from HTML content");

    // Generate PDF
    const pdfBuffer = await page.pdf({
      format,
      landscape,
      printBackground: true,
      margin: {
        top: "0",
        right: "0",
        bottom: "0",
        left: "0",
      },
    });

    logger.info("PDF generated successfully");

    return Buffer.from(pdfBuffer);
  } catch (error) {
    logger.error({ error }, "Failed to generate PDF");
    throw new Error(
      `PDF generation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  } finally {
    if (browser) {
      await browser.close();
      logger.info("Puppeteer browser closed");
    }
  }
}

/**
 * Generate CleanScore PDF report
 * This is a convenience wrapper around generatePDF with optimal settings for reports
 */
export async function generateCleanScorePDF(html: string): Promise<Buffer> {
  return generatePDF({
    html,
    format: "A4",
    landscape: false,
  });
}
