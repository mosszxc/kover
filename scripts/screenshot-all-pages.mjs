#!/usr/bin/env node
import { chromium } from "playwright";

const PAGES = [
  { name: "dashboard", path: "/" },
  { name: "upload", path: "/upload" },
  { name: "creatives", path: "/creatives" },
  { name: "generate", path: "/generate" },
  { name: "avatars", path: "/avatars" },
  { name: "modules", path: "/modules" },
  { name: "bmis", path: "/bmis" },
  { name: "bmis-new", path: "/bmis/new" },
  { name: "sync", path: "/sync" },
  { name: "lock-lists", path: "/lock-lists" },
  { name: "coverage", path: "/coverage" },
  { name: "alerts", path: "/alerts" },
  { name: "attribution", path: "/attribution" },
  { name: "tests", path: "/tests" },
  { name: "segments", path: "/segments" },
  { name: "hypotheses", path: "/hypotheses" },
  { name: "keitaro", path: "/keitaro" },
  { name: "stats", path: "/stats" },
  { name: "settings-profile", path: "/settings/profile" },
  { name: "settings-api-keys", path: "/settings/api-keys" },
];

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  const jsErrors = [];
  page.on("pageerror", (err) => {
    jsErrors.push({ url: page.url(), msg: err.message });
  });

  // Login
  await page.goto("http://localhost:5173/login");
  await page.waitForTimeout(2000);
  await page.locator('input[placeholder="@username"]').fill("mosszxc");
  await page.locator('input[type="password"]').fill("Jokerlox1");
  await page.click('button[type="submit"]');
  await page.waitForTimeout(8000); // Wait for full dashboard load
  console.log("Logged in, dashboard loaded");

  for (const { name, path } of PAGES) {
    // Navigate via client-side link click (no full page reload)
    await page.evaluate((p) => {
      // Find a <a> with this href or use history API
      const link = document.querySelector(`a[href="${p}"]`);
      if (link) {
        link.click();
      } else {
        // Fallback: use window.location (spa-aware)
        window.history.pushState({}, "", p);
        window.dispatchEvent(new PopStateEvent("popstate"));
      }
    }, path);

    await page.waitForTimeout(3000); // Let page render

    await page.screenshot({ path: `/tmp/pages/${name}.png`, fullPage: true });
    console.log(`✅ ${name}`);
  }

  if (jsErrors.length > 0) {
    console.log(`\n⚠️  ${jsErrors.length} JS errors:`);
    for (const e of jsErrors) console.log(`  ${e.url}: ${e.msg.slice(0, 120)}`);
  } else {
    console.log("\n✅ No JS errors!");
  }

  await browser.close();
})();
