import { chromium } from 'playwright';

const appUrl = 'http://localhost:5173';
const mockupUrl = 'file:///home/dev-moss/Rubick/rubick-dashboard-v4-premium.html';

const PROPS = ['backgroundColor', 'borderColor', 'color', 'fontSize', 'fontWeight', 'fontFamily', 'letterSpacing', 'padding', 'borderRadius', 'gap', 'lineHeight'];

async function getStyleByText(page, text, index = 0) {
  const els = await page.locator(`text="${text}"`).all();
  if (els.length <= index) return null;
  return els[index].evaluate((el, props) => {
    const cs = getComputedStyle(el);
    const r = {};
    for (const p of props) r[p] = cs[p];
    return r;
  }, PROPS);
}

async function getStyleByTextParent(page, text, index = 0) {
  const els = await page.locator(`text="${text}"`).all();
  if (els.length <= index) return null;
  return els[index].evaluate((el, props) => {
    const parent = el.closest('div') || el.parentElement;
    const cs = getComputedStyle(parent);
    const r = {};
    for (const p of props) r[p] = cs[p];
    return r;
  }, PROPS);
}

async function getFirstCardStyle(page) {
  // Get the first card-like container
  return page.evaluate((props) => {
    // Find "Total Creatives" and go up to card
    const label = [...document.querySelectorAll('*')].find(e => e.textContent.trim() === 'Total Creatives');
    if (!label) return null;
    let card = label;
    while (card && !card.classList.contains('card') && !card.className?.includes('bg-')) {
      card = card.parentElement;
    }
    // Go one more up if needed (find the main card container with border)
    while (card && card.parentElement && getComputedStyle(card).borderWidth === '0px') {
      card = card.parentElement;
    }
    const cs = getComputedStyle(card);
    const r = { tagName: card.tagName, className: card.className?.substring(0, 100) };
    for (const p of props) r[p] = cs[p];
    return r;
  }, PROPS);
}

const browser = await chromium.launch();

// ===== MOCKUP =====
const mp = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await mp.goto(mockupUrl, { waitUntil: 'networkidle' });

// ===== APP =====
const ap = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await ap.goto(appUrl, { waitUntil: 'networkidle', timeout: 30000 });
await ap.waitForTimeout(2000);
if (ap.url().includes('/login')) {
  await ap.fill('input[placeholder="@username"]', 'mosszxc');
  await ap.fill('input[placeholder="Your password"]', 'Jokerlox1');
  await ap.click('button:has-text("Sign In")');
  await ap.waitForTimeout(8000);
}

// Compare elements
const checks = [
  { label: 'KPI CARD (container)', fn: async (p) => getFirstCardStyle(p) },
  { label: 'KPI label "Total Creatives"', fn: async (p) => getStyleByText(p, 'Total Creatives') },
  { label: 'KPI value "1,247" / first big number', fn: async (p) => {
    // Find the large number element
    return p.evaluate((props) => {
      const el = [...document.querySelectorAll('*')].find(e =>
        e.children.length === 0 || (e.childNodes.length <= 3 && /^\d/.test(e.textContent.trim()))
          && getComputedStyle(e).fontSize === '30px');
      if (!el) return null;
      const cs = getComputedStyle(el);
      const r = { text: el.textContent.trim().substring(0, 20) };
      for (const p of props) r[p] = cs[p];
      return r;
    }, PROPS);
  }},
  { label: 'Card title "Performance"', fn: async (p) => getStyleByText(p, 'Performance') },
  { label: 'Card title "BMI Leaderboard"', fn: async (p) => getStyleByText(p, 'BMI Leaderboard') },
  { label: 'Card title "Recent Activity"', fn: async (p) => getStyleByText(p, 'Recent Activity') },
  { label: 'Card title "Alerts"', fn: async (p) => getStyleByText(p, 'Alerts') },
  { label: 'Card title "Module Coverage"', fn: async (p) => getStyleByText(p, 'Module Coverage') },
  { label: 'Period label "vs last 30d"', fn: async (p) => getStyleByText(p, 'vs last 30d') },
  { label: '"View all" link', fn: async (p) => getStyleByText(p, 'View all') },
  { label: 'Legend "Win Rate"', fn: async (p) => getStyleByText(p, 'Win Rate', 1) }, // 2nd occurrence (legend)
  { label: '"Hooks" coverage name', fn: async (p) => getStyleByText(p, 'Hooks') },
  { label: 'Page title "Dashboard"', fn: async (p) => {
    return p.evaluate((props) => {
      const h1 = document.querySelector('h1') || document.querySelector('.page-title');
      if (!h1) return null;
      const cs = getComputedStyle(h1);
      const r = { text: h1.textContent.trim() };
      for (const p of props) r[p] = cs[p];
      return r;
    }, PROPS);
  }},
  { label: 'Updated time "Updated 2m ago"', fn: async (p) => getStyleByText(p, 'Updated') },
];

console.log('\n====== PRECISE STYLE COMPARISON ======\n');

for (const check of checks) {
  const mStyle = await check.fn(mp);
  const aStyle = await check.fn(ap);

  if (!mStyle || !aStyle) {
    console.log(`[${check.label}] mockup=${mStyle ? 'found' : 'NOT FOUND'} app=${aStyle ? 'found' : 'NOT FOUND'}`);
    continue;
  }

  const diffs = [];
  for (const prop of PROPS) {
    if (mStyle[prop] && aStyle[prop] && mStyle[prop] !== aStyle[prop]) {
      diffs.push(`  ${prop}: M="${mStyle[prop]}" A="${aStyle[prop]}"`);
    }
  }

  if (diffs.length > 0) {
    console.log(`[${check.label}] DIFFERS:`);
    diffs.forEach(d => console.log(d));
  } else {
    console.log(`[${check.label}] ✓ MATCH`);
  }
  console.log('');
}

await browser.close();
