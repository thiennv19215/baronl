#!/usr/bin/env node

import { access, readdir, readFile } from 'node:fs/promises';
import { dirname, extname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, '..');
const roots = [resolve(repoRoot, 'docs'), resolve(repoRoot, 'assets')];
const failures = [];
let checkedLinks = 0;

async function markdownFiles(folder) {
  const files = [];
  for (const entry of await readdir(folder, { withFileTypes: true })) {
    const target = resolve(folder, entry.name);
    if (entry.isDirectory()) files.push(...await markdownFiles(target));
    else if (entry.isFile() && extname(entry.name).toLowerCase() === '.md') files.push(target);
  }
  return files;
}

for (const root of roots) {
  for (const file of await markdownFiles(root)) {
    const text = await readFile(file, 'utf8');
    const linkPattern = /!?\[[^\]]*\]\(([^)]+)\)/g;
    let match;
    while ((match = linkPattern.exec(text)) !== null) {
      let target = match[1].trim();
      if (target.startsWith('<') && target.endsWith('>')) target = target.slice(1, -1);
      if (/^(?:https?:|mailto:|#)/i.test(target)) continue;
      target = target.split('#', 1)[0];
      if (!target) continue;
      checkedLinks += 1;
      const absolute = resolve(dirname(file), decodeURIComponent(target));
      try {
        await access(absolute);
      } catch {
        const line = text.slice(0, match.index).split(/\r?\n/).length;
        failures.push(`${relative(repoRoot, file).replaceAll('\\', '/')}:${line} -> ${target}`);
      }
    }
  }
}

if (failures.length) {
  process.stderr.write(`Documentation link check failed: ${failures.length} missing target(s).\n`);
  for (const failure of failures) process.stderr.write(`- ${failure}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(`Documentation link check passed: ${checkedLinks} local link(s).\n`);
}
