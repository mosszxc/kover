import { chromium } from 'playwright';

const appUrl = 'http://localhost:5173';
const mockupUrl = 'file:///home/dev-moss/Rubick/rubick-dashboard-v4-premium.html';

async function extractStyles(page, selectors) {
  return page.evaluate((sels) => {
    const results = {};
    for (const [name, sel] of Object.entries(sels)) {
      const el = document.querySelector(sel);
      if (!el) { results[name] = null; continue; }
      const cs = getComputedStyle(el);
      results[name] = {
        backgroundColor: cs.backgroundColor,
        borderColor: cs.borderColor,
        borderWidth: cs.borderWidth,
        borderRadius: cs.borderRadius,
        color: cs.color,
        fontSize: cs.fontSize,
        fontWeight: cs.fontWeight,
        fontFamily: cs.fontFamily,
        letterSpacing: cs.letterSpacing,
        lineHeight: cs.lineHeight,
        padding: cs.padding,
        gap: cs.gap,
        boxShadow: cs.boxShadow,
      };
    }
    return results;
  }, selectors);
}

const browser = await chromium.launch();

// ===== MOCKUP =====
const mockupPage = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await mockupPage.goto(mockupUrl, { waitUntil: 'networkidle' });
await mockupPage.waitForTimeout(500);

const mockupSelectors = {
  card: '.card',
  kpiLabel: '.kpi-label',
  kpiValue: '.kpi-value',
  kpiChange: '.kpi-change',
  kpiPeriod: '.kpi-period',
  cardTitle: '.card-title',
  chartTab: '.chart-tab',
  chartTabActive: '.chart-tab.active',
  lbName: '.lb-name',
  lbMetric: '.lb-metric',
  lbRank: '.lb-rank',
  activityText: '.activity-text',
  activityTime: '.activity-time',
  activityTag: '.activity-tag',
  alertTitle: '.alert-title',
  alertDesc: '.alert-desc',
  alertBadge: '.alert-badge',
  coverageName: '.coverage-name',
  coverageValue: '.coverage-value',
  pageTitle: '.page-title',
  pageTime: '.page-time',
  chartLegendItem: '.chart-legend-item',
  chartLegendValue: '.chart-legend-value',
};

const mockupStyles = await extractStyles(mockupPage, mockupSelectors);

// ===== APP =====
const appPage = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await appPage.goto(appUrl, { waitUntil: 'networkidle', timeout: 30000 });
await appPage.waitForTimeout(2000);

if (appPage.url().includes('/login')) {
  await appPage.fill('input[placeholder="@username"]', 'mosszxc');
  await appPage.fill('input[placeholder="Your password"]', 'Jokerlox1');
  await appPage.click('button:has-text("Sign In")');
  await appPage.waitForTimeout(8000);
}

// Map app selectors to equivalent elements
const appSelectors = {
  card: '[class*="bg-"][class*="border"][class*="rounded"]',
  kpiLabel: '.text-xs.font-medium',
  kpiValue: '.font-mono.text-\\[30px\\]',
  kpiChange: '.font-mono.text-xs.font-semibold',
  kpiPeriod: '.text-\\[11px\\].text-\\[--text-tertiary\\]',
  cardTitle: '.text-\\[11px\\].font-semibold.uppercase',
  chartTab: '[class*="chart"] button, [class*="rounded-md"] button',
  chartTabActive: 'button[class*="shadow"]',
  lbName: '.text-\\[13px\\].font-medium.truncate',
  lbMetric: '.font-mono.text-\\[13px\\].font-semibold.tabular-nums',
  lbRank: '[class*="w-\\[22px\\]"]',
  activityText: '.text-\\[13px\\].leading-snug',
  activityTime: '.text-\\[11px\\].font-mono',
  activityTag: '.text-\\[10px\\].font-medium',
  alertTitle: '.text-\\[13px\\].font-medium',
  alertDesc: '.text-xs.text-\\[--text-subtle\\]',
  alertBadge: '.text-\\[10px\\].font-semibold.uppercase',
  coverageName: '.text-\\[13px\\].text-\\[--text-secondary\\]',
  coverageValue: '.font-mono.text-\\[13px\\].font-semibold',
  pageTitle: 'h1',
  pageTime: '.font-mono.text-xs',
  chartLegendItem: '.text-xs.text-\\[--text-secondary\\]',
  chartLegendValue: '.font-mono.font-semibold.text-\\[--text-primary\\]',
};

const appStyles = await extractStyles(appPage, appSelectors);

// ===== COMPARE =====
console.log('\n====== STYLE COMPARISON ======\n');

for (const key of Object.keys(mockupSelectors)) {
  const m = mockupStyles[key];
  const a = appStyles[key];

  if (!m) { console.log(`[${key}] MOCKUP: not found`); continue; }
  if (!a) { console.log(`[${key}] APP: not found`); continue; }

  const diffs = [];
  for (const prop of Object.keys(m)) {
    if (m[prop] !== a[prop]) {
      diffs.push(`  ${prop}: mockup="${m[prop]}" app="${a[prop]}"`);
    }
  }

  if (diffs.length > 0) {
    console.log(`[${key}] DIFFERS:`);
    diffs.forEach(d => console.log(d));
    console.log('');
  } else {
    console.log(`[${key}] ✓ match`);
  }
}

await browser.close();
