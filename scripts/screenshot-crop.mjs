import { chromium } from 'playwright';

const url = process.argv[2] || 'http://localhost:5173';
const output = process.argv[3] || '/tmp/crop.png';
const clip = JSON.parse(process.argv[4] || '{}'); // {x,y,width,height}
const waitMs = parseInt(process.argv[5] || '8000');

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(2000);

if (page.url().includes('/login')) {
  await page.fill('input[placeholder="@username"]', 'mosszxc');
  await page.fill('input[placeholder="Your password"]', 'Jokerlox1');
  await page.click('button:has-text("Sign In")');
  await page.waitForTimeout(waitMs);
}

if (clip.x !== undefined) {
  await page.screenshot({ path: output, clip });
} else {
  await page.screenshot({ path: output, fullPage: true });
}
console.log('Saved:', output);
await browser.close();
