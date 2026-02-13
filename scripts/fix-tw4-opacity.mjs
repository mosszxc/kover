#!/usr/bin/env node
import { readFileSync, writeFileSync } from "fs";
import { execSync } from "child_process";

const VAR_RGB = {
  "bg-surface-2": [26, 26, 29],
  "bg-surface-1": [17, 17, 19],
  "bg-base": [8, 8, 10],
  "status-success": [52, 211, 153],
  "status-error": [248, 113, 113],
  "accent-primary": [99, 102, 241],
};

const files = execSync(
  `grep -rl 'bg-\\[--.*\\]/' apps/web/src --include='*.tsx' --include='*.ts'`,
  { encoding: "utf-8" }
).trim().split("\n").filter(Boolean);

console.log(`Found ${files.length} files\n`);
let total = 0;

for (const file of files) {
  let content = readFileSync(file, "utf-8");
  const original = content;
  let count = 0;

  // Match: (optional-prefix)bg-[--var-name]/opacity
  content = content.replace(
    /(\S*?)bg-\[--([\w-]+)\]\/(\d+)/g,
    (match, prefix, varName, opacityPct) => {
      const rgb = VAR_RGB[varName];
      if (!rgb) {
        console.log(`  ⚠️ Unknown var --${varName} in ${file}`);
        return match;
      }
      const opacity = (parseInt(opacityPct) / 100).toFixed(2).replace(/\.?0+$/, "");
      count++;
      return `${prefix}bg-[rgba(${rgb[0]},${rgb[1]},${rgb[2]},${opacity})]`;
    }
  );

  if (content !== original) {
    writeFileSync(file, content);
    console.log(`✅ ${file}: ${count} replacements`);
    total += count;
  }
}

console.log(`\n🎉 Total: ${total} opacity replacements`);
