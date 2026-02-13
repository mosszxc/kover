#!/usr/bin/env node
/**
 * Fix ALL broken Tailwind v4 [--xxx] arbitrary value patterns across the codebase.
 */

import { readFileSync, writeFileSync } from "fs";
import { execSync } from "child_process";

const files = execSync(
  `grep -rl '\\(text\\|bg\\|border\\|rounded\\|ring\\|outline\\|shadow\\)-\\[--' apps/web/src --include='*.tsx' --include='*.ts'`,
  { encoding: "utf-8" }
).trim().split("\n").filter(Boolean);

console.log(`Found ${files.length} files with broken patterns\n`);

let totalReplacements = 0;
const manualFixes = [];

// Match any Tailwind variant prefix (hover:, focus:, group-hover:, data-[state=open]:, etc.)
// A prefix is: (word-chars or brackets or equals)+ followed by colon
const PREFIX = `(?:[\\w\\[\\]=.-]+:)*`;

for (const file of files) {
  let content = readFileSync(file, "utf-8");
  const original = content;
  let fileReplacements = 0;

  // 1. text-[--xxx] → [color:var(--xxx)]
  content = content.replace(
    new RegExp(`(${PREFIX})text-\\[--([\\w-]+)\\]`, "g"),
    (match, prefix, varName) => {
      fileReplacements++;
      return `${prefix}[color:var(--${varName})]`;
    }
  );

  // 2. bg-[--xxx]/NN → flag for manual fix (opacity modifier with var)
  content = content.replace(
    new RegExp(`(${PREFIX})bg-\\[--([\\w-]+)\\]/(\\d+)`, "g"),
    (match, prefix, varName, opacity) => {
      manualFixes.push({ file, pattern: match });
      return match; // leave as-is
    }
  );

  // 3. bg-[--xxx] → [background-color:var(--xxx)]
  content = content.replace(
    new RegExp(`(${PREFIX})bg-\\[--([\\w-]+)\\](?!/)`, "g"),
    (match, prefix, varName) => {
      fileReplacements++;
      return `${prefix}[background-color:var(--${varName})]`;
    }
  );

  // 4. border-[--xxx] → [border-color:var(--xxx)]
  content = content.replace(
    new RegExp(`(${PREFIX})border-\\[--([\\w-]+)\\]`, "g"),
    (match, prefix, varName) => {
      fileReplacements++;
      return `${prefix}[border-color:var(--${varName})]`;
    }
  );

  // 5. rounded-[--xxx] → rounded-[var(--xxx)]
  content = content.replace(
    new RegExp(`(${PREFIX})rounded-\\[--([\\w-]+)\\]`, "g"),
    (match, prefix, varName) => {
      fileReplacements++;
      return `${prefix}rounded-[var(--${varName})]`;
    }
  );

  // 6. ring-[--xxx] → [--tw-ring-color:var(--xxx)]
  content = content.replace(
    new RegExp(`(${PREFIX})ring-\\[--([\\w-]+)\\]`, "g"),
    (match, prefix, varName) => {
      fileReplacements++;
      return `${prefix}[--tw-ring-color:var(--${varName})]`;
    }
  );

  if (content !== original) {
    writeFileSync(file, content);
    console.log(`✅ ${file}: ${fileReplacements} replacements`);
    totalReplacements += fileReplacements;
  }
}

console.log(`\n🎉 Total: ${totalReplacements} replacements across ${files.length} files`);

if (manualFixes.length > 0) {
  console.log(`\n⚠️  ${manualFixes.length} patterns need manual fix (opacity modifiers):`);
  for (const f of manualFixes) {
    console.log(`   ${f.file}: ${f.pattern}`);
  }
}
