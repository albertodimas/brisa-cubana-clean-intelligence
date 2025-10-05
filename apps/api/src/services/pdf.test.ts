import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock puppeteer
const mockPdf = vi.fn();
const mockSetContent = vi.fn();
const mockNewPage = vi.fn();
const mockClose = vi.fn();
const mockLaunch = vi.fn();

vi.mock("puppeteer", () => ({
  default: {
    launch: mockLaunch,
  },
}));

// Mock logger
vi.mock("../lib/logger", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

describe("PDF Service", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };

    // Setup default mock behavior
    mockPdf.mockResolvedValue(Buffer.from("fake-pdf-content"));
    mockSetContent.mockResolvedValue(undefined);
    mockNewPage.mockResolvedValue({
      setContent: mockSetContent,
      pdf: mockPdf,
    });
    mockClose.mockResolvedValue(undefined);
    mockLaunch.mockResolvedValue({
      newPage: mockNewPage,
      close: mockClose,
    });
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.resetModules();
  });

  describe("generatePDF", () => {
    it("should generate PDF with default A4 format", async () => {
      const { generatePDF } = await import("./pdf");

      const result = await generatePDF({
        html: "<h1>Test Report</h1>",
      });

      expect(result).toBeInstanceOf(Buffer);
      expect(mockLaunch).toHaveBeenCalledWith({
        headless: true,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-gpu",
        ],
      });
      expect(mockSetContent).toHaveBeenCalledWith("<h1>Test Report</h1>", {
        waitUntil: "networkidle0",
        timeout: 30000,
      });
      expect(mockPdf).toHaveBeenCalledWith({
        format: "A4",
        landscape: false,
        printBackground: true,
        margin: {
          top: "0",
          right: "0",
          bottom: "0",
          left: "0",
        },
      });
    });

    it("should generate PDF with Letter format", async () => {
      const { generatePDF } = await import("./pdf");

      await generatePDF({
        html: "<h1>Letter Size</h1>",
        format: "Letter",
      });

      expect(mockPdf).toHaveBeenCalledWith(
        expect.objectContaining({
          format: "Letter",
        }),
      );
    });

    it("should generate PDF in landscape mode", async () => {
      const { generatePDF } = await import("./pdf");

      await generatePDF({
        html: "<h1>Landscape</h1>",
        landscape: true,
      });

      expect(mockPdf).toHaveBeenCalledWith(
        expect.objectContaining({
          landscape: true,
        }),
      );
    });

    it("should generate PDF with both Letter format and landscape", async () => {
      const { generatePDF } = await import("./pdf");

      await generatePDF({
        html: "<h1>Custom</h1>",
        format: "Letter",
        landscape: true,
      });

      expect(mockPdf).toHaveBeenCalledWith(
        expect.objectContaining({
          format: "Letter",
          landscape: true,
        }),
      );
    });

    it("should enable print background by default", async () => {
      const { generatePDF } = await import("./pdf");

      await generatePDF({
        html: "<div style='background: blue'>Test</div>",
      });

      expect(mockPdf).toHaveBeenCalledWith(
        expect.objectContaining({
          printBackground: true,
        }),
      );
    });

    it("should set margins to zero", async () => {
      const { generatePDF } = await import("./pdf");

      await generatePDF({
        html: "<h1>No Margins</h1>",
      });

      expect(mockPdf).toHaveBeenCalledWith(
        expect.objectContaining({
          margin: {
            top: "0",
            right: "0",
            bottom: "0",
            left: "0",
          },
        }),
      );
    });

    it("should wait for network idle before generating PDF", async () => {
      const { generatePDF } = await import("./pdf");

      await generatePDF({
        html: "<img src='test.png' />",
      });

      expect(mockSetContent).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          waitUntil: "networkidle0",
        }),
      );
    });

    it("should set 30 second timeout for content loading", async () => {
      const { generatePDF } = await import("./pdf");

      await generatePDF({
        html: "<h1>Slow Content</h1>",
      });

      expect(mockSetContent).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          timeout: 30000,
        }),
      );
    });

    it("should close browser after successful generation", async () => {
      const { generatePDF } = await import("./pdf");

      await generatePDF({
        html: "<h1>Test</h1>",
      });

      expect(mockClose).toHaveBeenCalled();
    });

    it("should close browser even if PDF generation fails", async () => {
      mockPdf.mockRejectedValue(new Error("PDF generation failed"));

      const { generatePDF } = await import("./pdf");

      await expect(
        generatePDF({
          html: "<h1>Fail</h1>",
        }),
      ).rejects.toThrow("PDF generation failed");

      expect(mockClose).toHaveBeenCalled();
    });

    it("should handle browser launch failure", async () => {
      mockLaunch.mockRejectedValue(new Error("Browser launch failed"));

      const { generatePDF } = await import("./pdf");

      await expect(
        generatePDF({
          html: "<h1>Test</h1>",
        }),
      ).rejects.toThrow("PDF generation failed: Browser launch failed");
    });

    it("should handle page creation failure", async () => {
      mockNewPage.mockRejectedValue(new Error("Page creation failed"));

      const { generatePDF } = await import("./pdf");

      await expect(
        generatePDF({
          html: "<h1>Test</h1>",
        }),
      ).rejects.toThrow("PDF generation failed: Page creation failed");

      expect(mockClose).toHaveBeenCalled();
    });

    it("should handle content setting failure", async () => {
      mockSetContent.mockRejectedValue(new Error("Content load timeout"));

      const { generatePDF } = await import("./pdf");

      await expect(
        generatePDF({
          html: "<h1>Test</h1>",
        }),
      ).rejects.toThrow("PDF generation failed: Content load timeout");

      expect(mockClose).toHaveBeenCalled();
    });

    it("should handle unknown error types", async () => {
      mockPdf.mockRejectedValue("String error");

      const { generatePDF } = await import("./pdf");

      await expect(
        generatePDF({
          html: "<h1>Test</h1>",
        }),
      ).rejects.toThrow("PDF generation failed: Unknown error");

      expect(mockClose).toHaveBeenCalled();
    });

    it("should return Buffer from PDF generation", async () => {
      const fakeBuffer = Buffer.from("test-pdf-data");
      mockPdf.mockResolvedValue(fakeBuffer);

      const { generatePDF } = await import("./pdf");

      const result = await generatePDF({
        html: "<h1>Buffer Test</h1>",
      });

      expect(result).toBeInstanceOf(Buffer);
      expect(result).toEqual(fakeBuffer);
    });

    it("should handle complex HTML with styles", async () => {
      const { generatePDF } = await import("./pdf");

      const complexHtml = `
        <html>
          <head>
            <style>
              body { font-family: Arial; }
              .header { background: blue; color: white; }
            </style>
          </head>
          <body>
            <div class="header">Complex Report</div>
            <p>Content here</p>
          </body>
        </html>
      `;

      await generatePDF({ html: complexHtml });

      expect(mockSetContent).toHaveBeenCalledWith(
        complexHtml,
        expect.any(Object),
      );
    });
  });

  describe("generateCleanScorePDF", () => {
    it("should generate PDF with A4 format", async () => {
      const { generateCleanScorePDF } = await import("./pdf");

      await generateCleanScorePDF("<h1>CleanScore Report</h1>");

      expect(mockPdf).toHaveBeenCalledWith(
        expect.objectContaining({
          format: "A4",
        }),
      );
    });

    it("should generate PDF in portrait mode (not landscape)", async () => {
      const { generateCleanScorePDF } = await import("./pdf");

      await generateCleanScorePDF("<h1>CleanScore Report</h1>");

      expect(mockPdf).toHaveBeenCalledWith(
        expect.objectContaining({
          landscape: false,
        }),
      );
    });

    it("should return Buffer", async () => {
      const { generateCleanScorePDF } = await import("./pdf");

      const result = await generateCleanScorePDF("<h1>CleanScore Report</h1>");

      expect(result).toBeInstanceOf(Buffer);
    });

    it("should handle CleanScore report template", async () => {
      const { generateCleanScorePDF } = await import("./pdf");

      const reportHtml = `
        <div class="cleanscore-report">
          <h1>Property CleanScore: 95/100</h1>
          <section class="metrics">
            <div>Cleanliness: Excellent</div>
            <div>Maintenance: Good</div>
          </section>
        </div>
      `;

      await generateCleanScorePDF(reportHtml);

      expect(mockSetContent).toHaveBeenCalledWith(
        reportHtml,
        expect.any(Object),
      );
    });

    it("should close browser after generation", async () => {
      const { generateCleanScorePDF } = await import("./pdf");

      await generateCleanScorePDF("<h1>Test</h1>");

      expect(mockClose).toHaveBeenCalled();
    });

    it("should handle generation errors gracefully", async () => {
      mockPdf.mockRejectedValue(new Error("Generation failed"));

      const { generateCleanScorePDF } = await import("./pdf");

      await expect(generateCleanScorePDF("<h1>Test</h1>")).rejects.toThrow();

      expect(mockClose).toHaveBeenCalled();
    });
  });
});
