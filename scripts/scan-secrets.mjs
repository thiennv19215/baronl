#!/usr/bin/env node

import { lstat, readFile, readdir } from 'node:fs/promises';
import { basename, dirname, extname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, '..');
const requested = process.argv.slice(2).filter((value) => !value.startsWith('--'));
const roots = requested.length ? requested.map((value) => resolve(process.cwd(), value)) : [repoRoot];
const maxBytes = 10 * 1024 * 1024;
const ignoredDirectories = new Set(['.git', 'node_modules', 'coverage', '.vite']);
const forbiddenFilePatterns = [/^\.env$/i, /^\.env\.(?!example$|sample$)/i, /\.(?:pem|p12|pfx|key)$/i];
const contentPatterns = [
  { name: 'private-key', regex: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g },
  { name: 'openai-like-key', regex: /\bsk-[A-Za-z0-9_-]{20,}\b/g },
  { name: 'aws-access-key', regex: /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/g },
  { name: 'github-token', regex: /\bgh[pousr]_[A-Za-z0-9]{30,}\b/g },
  { name: 'bearer-token', regex: /\bBearer\s+[A-Za-z0-9._~+/-]{24,}={0,2}\b/gi },
  { name: 'canary-secret', regex: /ORBITSTAGE_CANARY_SECRET_[A-Za-z0-9_-]+/g }
];
const findings = [];

async function scan(target) {
  const stat = await lstat(target);
  if (stat.isSymbolicLink()) return;
  if (stat.isDirectory()) {
    if (ignoredDirectories.has(basename(target))) return;
    for (const entry of await readdir(target)) await scan(resolve(target, entry));
    return;
  }
  if (!stat.isFile()) return;
  const name = basename(target);
  if (forbiddenFilePatterns.some((pattern) => pattern.test(name))) {
    findings.push({ type: 'forbidden-file', file: relative(repoRoot, target).replaceAll('\\', '/') });
  }
  if (stat.size > maxBytes) return;
  const extension = extname(name).toLowerCase();
  if (['.png', '.jpg', '.jpeg', '.gif', '.webp', '.wav', '.mp3', '.ogg', '.webm', '.mp4', '.exe', '.dll'].includes(extension)) return;
  const text = await readFile(target, 'utf8');
  for (const { name: patternName, regex } of contentPatterns) {
    regex.lastIndex = 0;
    let match;
    while ((match = regex.exec(text)) !== null) {
      const line = text.slice(0, match.index).split(/\r?\n/).length;
      findings.push({ type: patternName, file: relative(repoRoot, target).replaceAll('\\', '/'), line });
      if (match[0].length === 0) regex.lastIndex += 1;
    }
  }
}

for (const root of roots) {
  try {
    await scan(root);
  } catch (error) {
    findings.push({ type: 'scan-error', file: root, detail: error.message });
  }
}

if (findings.length === 0) {
  process.stdout.write(`Secret scan passed for ${roots.length} root(s).\n`);
} else {
  process.stderr.write(`Secret scan found ${findings.length} issue(s):\n`);
  for (const finding of findings) {
    process.stderr.write(`- ${finding.type}: ${finding.file}${finding.line ? `:${finding.line}` : ''}${finding.detail ? ` (${finding.detail})` : ''}\n`);
  }
  process.exitCode = 1;
}
