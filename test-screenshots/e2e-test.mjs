import { chromium } from 'playwright';

const BASE = 'http://localhost:3001';

async function run() {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();
  
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push({ url: page.url(), text: msg.text() });
    }
  });
  
  const pageErrors = [];
  page.on('pageerror', err => {
    pageErrors.push({ url: page.url(), message: err.message });
  });

  // 1. Login with correct password
  console.log('--- LOGIN ---');
  await page.goto(`${BASE}/login`);
  await page.waitForTimeout(2000); // wait for HMR
  await page.fill('input[type="email"]', 'admin@aladil.org');
  await page.fill('input[type="password"]', 'admin123!');
  await page.click('button[type="submit"]');
  
  try {
    await page.waitForURL('**/admin**', { timeout: 15000 });
    console.log('Login OK! URL:', page.url());
  } catch {
    console.log('Login FAILED, taking screenshot...');
    await page.screenshot({ path: 'test-screenshots/login-fail.png', fullPage: true });
    await browser.close();
    return;
  }

  // 2. Screenshot admin dashboard
  await page.screenshot({ path: 'test-screenshots/admin.png', fullPage: true });

  // 3. Test all admin pages
  const adminRoutes = [
    ['/admin/news', 'admin_news'],
    ['/admin/meetings', 'admin_meetings'],
    ['/admin/labs', 'admin_labs'],
    ['/admin/executive', 'admin_executive'],
    ['/admin/users', 'admin_users'],
    ['/admin/contact', 'admin_contact'],
    ['/admin/pila', 'admin_pila'],
  ];

  for (const [route, name] of adminRoutes) {
    console.log(`Testing ${route}...`);
    try {
      await page.goto(`${BASE}${route}`, { waitUntil: 'networkidle', timeout: 15000 });
      await page.screenshot({ path: `test-screenshots/${name}.png`, fullPage: true });
      
      // Check for visible error text in page
      const text = await page.textContent('body');
      const hasError = text.includes('Error al cargar') || text.includes('error') && text.includes('destructive');
      console.log(`  OK${hasError ? ' (has error state)' : ''}`);
    } catch (err) {
      console.log(`  TIMEOUT/FAIL - ${err.message.substring(0, 100)}`);
    }
  }

  // 4. Test 404 page
  console.log('Testing /nonexistent...');
  await page.goto(`${BASE}/nonexistent`, { timeout: 10000 });
  await page.screenshot({ path: 'test-screenshots/not-found.png', fullPage: true });

  // 5. Test error boundary (try accessing bad admin route)
  console.log('Testing /admin/news/bad-uuid...');
  await page.goto(`${BASE}/admin/news/bad-uuid`, { timeout: 10000 });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'test-screenshots/admin_news_bad_id.png', fullPage: true });

  // 6. Report
  console.log('\n=== CONSOLE ERRORS ===');
  const filtered = consoleErrors.filter(e => 
    !e.text.includes('DevTools') && 
    !e.text.includes('HMR') &&
    !e.text.includes('NEXT_REDIRECT')
  );
  if (filtered.length === 0) {
    console.log('No relevant console errors');
  } else {
    for (const e of filtered) {
      console.log(`  [${e.url}] ${e.text.substring(0, 200)}`);
    }
  }
  
  console.log('\n=== PAGE ERRORS ===');
  if (pageErrors.length === 0) {
    console.log('No uncaught exceptions');
  } else {
    for (const e of pageErrors) {
      console.log(`  [${e.url}] ${e.message.substring(0, 200)}`);
    }
  }

  console.log(`\nTotal console errors: ${filtered.length}`);
  console.log(`Total page errors: ${pageErrors.length}`);

  await browser.close();
}

run().catch(err => { console.error('SCRIPT FAILED:', err.message); process.exit(1); });
