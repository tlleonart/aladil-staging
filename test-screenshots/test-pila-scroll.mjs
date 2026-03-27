import { chromium } from "playwright";

const BASE = "http://localhost:3000";

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  // Login
  await page.goto(`${BASE}/login`);
  await page.fill('input[type="email"]', "admin@aladil.org");
  await page.fill('input[type="password"]', "admin123!");
  await page.click('button[type="submit"]');
  await page.waitForURL("**/admin**", { timeout: 15000 });

  // Go to PILA page and scroll to bottom
  await page.goto(`${BASE}/admin/pila`);
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(2000);

  // Scroll to bottom to see published reports section
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(1000);
  await page.screenshot({ path: "test-screenshots/pila-page-bottom.png", fullPage: true });
  console.log("Full page screenshot saved");

  // Check if "Informes Publicados" section exists
  const published = await page.getByText("Informes Publicados").isVisible();
  console.log("Informes Publicados visible:", published);

  // Check for download links
  const downloadLinks = await page.getByRole("link", { name: /Descargar PDF/i }).count();
  console.log("Download PDF links:", downloadLinks);

  await browser.close();
}

run().catch(console.error);
