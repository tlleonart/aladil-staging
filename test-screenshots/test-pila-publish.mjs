import { chromium } from "playwright";

const BASE = "http://localhost:3000";

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  // Collect console errors
  const errors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  page.on("pageerror", (err) => errors.push(err.message));

  try {
    // 1. Login
    console.log("1. Logging in...");
    await page.goto(`${BASE}/login`);
    await page.fill('input[type="email"]', "admin@aladil.org");
    await page.fill('input[type="password"]', "admin123!");
    await page.click('button[type="submit"]');
    await page.waitForURL("**/admin**", { timeout: 15000 });
    console.log("   OK - Logged in at:", page.url());

    // 2. Go to PILA reports page
    console.log("2. Navigating to PILA reports...");
    await page.goto(`${BASE}/admin/pila/reports`);
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: "test-screenshots/pila-reports.png" });
    console.log("   OK - PILA reports page loaded");

    // 3. Click "Generar Informe" button
    console.log("3. Generating report...");
    const generateBtn = page.getByRole("button", { name: /Generar Informe/i });
    if (await generateBtn.isVisible()) {
      await generateBtn.click();
      // Wait for the report table or error to appear
      await page.waitForTimeout(5000);
      await page.screenshot({ path: "test-screenshots/pila-report-generated.png" });
      console.log("   OK - Report generated");

      // 4. Look for "Publicar para Laboratorios" button
      console.log("4. Looking for publish button...");
      const publishBtn = page.getByRole("button", { name: /Publicar para Laboratorios/i });
      if (await publishBtn.isVisible()) {
        console.log("   Found publish button, clicking...");
        await publishBtn.click();
        // Wait for upload and response
        await page.waitForTimeout(10000);
        await page.screenshot({ path: "test-screenshots/pila-report-published.png" });
        console.log("   OK - Publish completed");
      } else {
        console.log("   WARN - Publish button not visible (no data to publish?)");
      }
    } else {
      console.log("   WARN - Generate button not found");
    }

    // 5. Go to PILA page (reporter view) to check published reports
    console.log("5. Checking published reports in PILA page...");
    await page.goto(`${BASE}/admin/pila`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);
    await page.screenshot({ path: "test-screenshots/pila-published-list.png" });
    console.log("   OK - PILA page with published reports");

  } catch (err) {
    console.error("ERROR:", err.message);
    await page.screenshot({ path: "test-screenshots/pila-error.png" });
  }

  if (errors.length > 0) {
    console.log("\nConsole errors:");
    errors.forEach((e) => console.log("  -", e));
  } else {
    console.log("\nNo console errors!");
  }

  await browser.close();
}

run().catch(console.error);
