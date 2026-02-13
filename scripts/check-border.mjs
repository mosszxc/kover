import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

await page.goto('http://localhost:5173', { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(2000);
if (page.url().includes('/login')) {
  await page.fill('input[placeholder="@username"]', 'mosszxc');
  await page.fill('input[placeholder="Your password"]', 'Jokerlox1');
  await page.click('button:has-text("Sign In")');
  await page.waitForTimeout(8000);
}

// Get computed border style of first KPI card
const borderColor = await page.evaluate(() => {
  // Find the first KPI card — it has "Total Creatives" text
  const cards = document.querySelectorAll('[class*="border"]');
  for (const card of cards) {
    if (card.textContent?.includes('Total Creatives')) {
      const style = getComputedStyle(card);
      return {
        borderColor: style.borderColor,
        borderWidth: style.borderWidth,
        borderStyle: style.borderStyle,
        backgroundColor: style.backgroundColor,
        borderDefault: getComputedStyle(document.documentElement).getPropertyValue('--border-default'),
      };
    }
  }
  return 'not found';
});

console.log(JSON.stringify(borderColor, null, 2));
await browser.close();
