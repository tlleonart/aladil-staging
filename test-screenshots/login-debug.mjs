import { chromium } from 'playwright';

async function run() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  
  const consoleMessages = [];
  page.on('console', msg => consoleMessages.push(`[${msg.type()}] ${msg.text()}`));
  
  await page.goto('http://localhost:3001/login');
  await page.fill('input[type="email"]', 'admin@aladil.org');
  await page.fill('input[type="password"]', 'admin123');
  await page.click('button[type="submit"]');
  
  // Wait a bit for response
  await page.waitForTimeout(5000);
  
  await page.screenshot({ path: 'test-screenshots/login-result.png', fullPage: true });
  console.log('Current URL:', page.url());
  console.log('Page title:', await page.title());
  
  // Check for visible error text
  const bodyText = await page.textContent('body');
  if (bodyText.includes('error') || bodyText.includes('Error') || bodyText.includes('incorrect') || bodyText.includes('inválid')) {
    console.log('ERROR TEXT FOUND on page');
  }
  
  console.log('\nConsole messages:');
  for (const m of consoleMessages) {
    console.log('  ', m.substring(0, 200));
  }
  
  await browser.close();
}

run().catch(err => { console.error('FAIL:', err.message); process.exit(1); });
