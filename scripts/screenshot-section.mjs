import { chromium } from 'playwright';

const section = process.argv[2] || 'kpi'; // kpi, chart, row3
const source = process.argv[3] || 'app'; // app or mockup
const output = process.argv[4] || '/tmp/section.png';

const urls = {
  app: 'http://localhost:5173',
  mockup: 'file:///home/dev-moss/Rubick/rubick-dashboard-v4-premium.html'
};

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1200 } });
const url = urls[source];

await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(2000);

if (page.url().includes('/login')) {
  await page.fill('input[placeholder="@username"]', 'mosszxc');
  await page.fill('input[placeholder="Your password"]', 'Jokerlox1');
  await page.click('button:has-text("Sign In")');
  await page.waitForTimeout(8000);
}

await page.mouse.move(1400, 10);
await page.waitForTimeout(300);

// Sections defined by approximate clip regions
const sections = {
  kpi: { x: 210, y: 105, width: 1080, height: 170 },
  chart: { x: 210, y: 280, width: 700, height: 305 },
  leaderboard: { x: 910, y: 280, width: 380, height: 305 },
  row3: { x: 210, y: 595, width: 1080, height: 340 },
};

const clip = sections[section];
if (!clip) { console.error('Unknown section:', section); process.exit(1); }

// For mockup, offset X by +20 (sidebar is wider in mockup)
if (source === 'mockup') { clip.x += 20; }

await page.screenshot({ path: output, clip });
console.log('Saved:', output);
await browser.close();
