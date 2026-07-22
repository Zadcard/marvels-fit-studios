import { chromium } from '@playwright/test';
import path from 'path';

async function capture() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  const outDir = path.join(process.cwd(), 'presentation-output', 'screenshots');

  // 1. Login
  console.log('Capturing login.png...');
  await page.goto('http://localhost:3000/login');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(outDir, 'login.png') });

  // Sign in as Admin
  await page.fill('input[name="email"]', 'admin@marvelfitness.demo');
  await page.fill('input[name="password"]', 'MarvelAdmin2026!');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/admin**');
  await page.waitForTimeout(1500);

  // 2. Dashboard
  console.log('Capturing dashboard.png...');
  await page.screenshot({ path: path.join(outDir, 'dashboard.png') });

  // 3. Leads
  console.log('Capturing leads.png...');
  await page.goto('http://localhost:3000/admin/leads');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(outDir, 'leads.png') });

  // 4. Clients
  console.log('Capturing clients.png...');
  await page.goto('http://localhost:3000/admin/clients');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(outDir, 'clients.png') });

  // 5. Client profile
  console.log('Capturing client-profile.png...');
  const firstClient = page.locator('button:has-text("Omar Tarek")').first();
  if (await firstClient.isVisible()) {
    await firstClient.click();
    await page.waitForTimeout(1000);
  }
  await page.screenshot({ path: path.join(outDir, 'client-profile.png') });

  // 6. Programs
  console.log('Capturing programs.png...');
  await page.goto('http://localhost:3000/admin/programs');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(outDir, 'programs.png') });

  // 7. Subscriptions
  console.log('Capturing subscriptions.png...');
  await page.goto('http://localhost:3000/admin/subscriptions');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(outDir, 'subscriptions.png') });

  // 8. Schedule
  console.log('Capturing schedule.png...');
  await page.goto('http://localhost:3000/admin/schedule');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(outDir, 'schedule.png') });

  // 9. Reports (Analytics)
  console.log('Capturing reports.png...');
  await page.goto('http://localhost:3000/admin/reports');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(outDir, 'reports.png') });

  // 10. Coach Dashboard
  console.log('Capturing coach-dashboard.png...');
  await page.goto('http://localhost:3000/coach');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(outDir, 'coach-dashboard.png') });

  await browser.close();
  console.log('All 10 fresh screenshots captured successfully!');
}

capture().catch(err => {
  console.error('Screenshot error:', err);
  process.exit(1);
});
