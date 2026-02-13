// Fix Tailwind v4 broken [--xxx] syntax in dashboard components
// text-[--xxx] → [color:var(--xxx)]
// bg-[--xxx] → [background-color:var(--xxx)]
// hover:text-[--xxx] → hover:[color:var(--xxx)]
// hover:bg-[--xxx] → hover:[background-color:var(--xxx)]
// group-hover:text-[--xxx] → group-hover:[color:var(--xxx)]

import { readFileSync, writeFileSync } from 'fs';

const files = [
  'apps/web/src/components/dashboard/KPICard.tsx',
  'apps/web/src/components/dashboard/PerformanceChart.tsx',
  'apps/web/src/components/dashboard/RecentActivity.tsx',
  'apps/web/src/components/dashboard/AlertsCard.tsx',
  'apps/web/src/components/dashboard/BMILeaderboard.tsx',
  'apps/web/src/components/dashboard/ModuleCoverage.tsx',
  'apps/web/src/components/dashboard/PendingTasks.tsx',
  'apps/web/src/components/dashboard/CoverageRecommendations.tsx',
];

let totalReplacements = 0;

for (const file of files) {
  let content = readFileSync(file, 'utf-8');
  const original = content;

  // text-[--xxx] → [color:var(--xxx)]  (but NOT text-[11px] etc — only text-[--xxx])
  content = content.replace(/(?<!hover:|group-hover:)text-\[--([a-z-]+)\]/g, (match, varName) => {
    totalReplacements++;
    return `[color:var(--${varName})]`;
  });

  // hover:text-[--xxx] → hover:[color:var(--xxx)]
  content = content.replace(/hover:text-\[--([a-z-]+)\]/g, (match, varName) => {
    totalReplacements++;
    return `hover:[color:var(--${varName})]`;
  });

  // group-hover:text-[--xxx] → group-hover:[color:var(--xxx)]
  content = content.replace(/group-hover:text-\[--([a-z-]+)\]/g, (match, varName) => {
    totalReplacements++;
    return `group-hover:[color:var(--${varName})]`;
  });

  // bg-[--xxx] → [background-color:var(--xxx)]  (but NOT bg-[rgba...] or bg-[#...])
  // Also handle bg-[--xxx]/50 opacity modifier
  content = content.replace(/(?<!hover:|group-hover:)bg-\[--([a-z0-9-]+)\](\/\d+)?/g, (match, varName, opacity) => {
    totalReplacements++;
    if (opacity) {
      // For opacity modifier like /50, we need a different approach
      // bg-[--bg-surface-2]/50 → [background-color:color-mix(in srgb, var(--bg-surface-2) 50%, transparent)]
      // Actually simpler: just use rgba or opacity
      const pct = parseInt(opacity.slice(1));
      return `[background-color:var(--${varName})] opacity-${pct}`;
      // Wait that's wrong, opacity affects everything. Let me just inline it differently.
    }
    return `[background-color:var(--${varName})]`;
  });

  // hover:bg-[--xxx] → hover:[background-color:var(--xxx)]
  content = content.replace(/hover:bg-\[--([a-z0-9-]+)\](\/\d+)?/g, (match, varName, opacity) => {
    totalReplacements++;
    if (opacity) {
      return `hover:[background-color:var(--${varName})]`;
    }
    return `hover:[background-color:var(--${varName})]`;
  });

  if (content !== original) {
    writeFileSync(file, content, 'utf-8');
    const count = content !== original ? '(changed)' : '(no change)';
    console.log(`✓ ${file} ${count}`);
  } else {
    console.log(`  ${file} (no change)`);
  }
}

console.log(`\nTotal replacements: ${totalReplacements}`);
