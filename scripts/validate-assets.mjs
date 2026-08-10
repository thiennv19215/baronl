#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { access, lstat, readFile, realpath, readdir } from 'node:fs/promises';
import { dirname, extname, isAbsolute, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, '..');
const assetRoot = resolve(repoRoot, 'assets');
const manifestPath = resolve(assetRoot, 'manifest.json');
const outputJson = process.argv.includes('--json');

const allowedCategories = new Set(['brand', 'background', 'avatar', 'gift', 'badge', 'character', 'texture', 'audio', 'video', 'music']);
const allowedSources = new Set(['generated-in-repository', 'project-owner', 'third-party']);
const allowedRights = new Set(['approved', 'restricted', 'pending', 'rejected']);
const expectedMime = new Map([
  ['.svg', 'image/svg+xml'],
  ['.png', 'image/png'],
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.webp', 'image/webp'],
  ['.gif', 'image/gif'],
  ['.ico', 'image/x-icon'],
  ['.wav', 'audio/wav'],
  ['.mp3', 'audio/mpeg'],
  ['.ogg', 'audio/ogg'],
  ['.webm', 'video/webm'],
  ['.mp4', 'video/mp4'],
  ['.json', 'application/json'],
  ['.moc3', 'application/octet-stream'],
  ['.glb', 'model/gltf-binary'],
  ['.gltf', 'model/gltf+json']
]);
const assetExtensions = new Set(expectedMime.keys());
const registryFiles = new Set([
  resolve(assetRoot, 'manifest.json').toLowerCase(),
  resolve(assetRoot, 'manifest.schema.json').toLowerCase()
]);
const errors = [];
const warnings = [];
const assetRecords = [];

function problem(list, code, message, assetId) {
  list.push({ code, message, ...(assetId ? { assetId } : {}) });
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function assert(condition, code, message, assetId) {
  if (!condition) problem(errors, code, message, assetId);
}

function isWithin(parent, child) {
  const rel = relative(parent, child);
  return rel === '' || (!rel.startsWith(`..${sep}`) && rel !== '..' && !isAbsolute(rel));
}

async function listAssetFiles(folder) {
  const result = [];
  for (const entry of await readdir(folder, { withFileTypes: true })) {
    const full = resolve(folder, entry.name);
    if (entry.isDirectory()) result.push(...await listAssetFiles(full));
    else if (entry.isFile() && assetExtensions.has(extname(entry.name).toLowerCase())) result.push(full);
    else if (entry.isSymbolicLink()) problem(errors, 'ASSET_SYMLINK', `Symlink is not allowed: ${relative(repoRoot, full)}`);
  }
  return result;
}

let manifest;
try {
  manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
} catch (error) {
  problem(errors, 'MANIFEST_READ', `Cannot read/parse ${manifestPath}: ${error.message}`);
  manifest = null;
}

const registeredFiles = new Set();
const seenIds = new Set();
const seenPaths = new Set();

if (manifest) {
  const topLevelKeys = new Set(['$schema', 'schemaVersion', 'assets']);
  for (const key of Object.keys(manifest)) {
    assert(topLevelKeys.has(key), 'MANIFEST_FIELD', `Unknown top-level field: ${key}`);
  }
  assert(manifest.schemaVersion === 1, 'SCHEMA_VERSION', 'schemaVersion must be 1');
  assert(Array.isArray(manifest.assets), 'ASSET_LIST', 'assets must be an array');
  assert(Array.isArray(manifest.assets) && manifest.assets.length > 0, 'ASSET_LIST_EMPTY', 'assets must contain at least one entry');

  for (const [index, asset] of (Array.isArray(manifest.assets) ? manifest.assets : []).entries()) {
    const fallbackId = `index:${index}`;
    assert(isPlainObject(asset), 'ASSET_OBJECT', `Asset at index ${index} must be an object`, fallbackId);
    if (!isPlainObject(asset)) continue;
    const id = typeof asset.id === 'string' ? asset.id : fallbackId;
    assetRecords.push(asset);
    const assetKeys = new Set(['id', 'category', 'mimeType', 'path', 'bytes', 'sha256', 'placeholder', 'source', 'rights', 'metadata']);
    for (const key of Object.keys(asset)) {
      assert(assetKeys.has(key), 'ASSET_FIELD', `Unknown asset field: ${key}`, id);
    }

    assert(/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(asset.id ?? ''), 'ASSET_ID', 'id must be lowercase kebab-case', id);
    assert(!seenIds.has(id), 'DUPLICATE_ID', `Duplicate asset id: ${id}`, id);
    seenIds.add(id);
    assert(allowedCategories.has(asset.category), 'CATEGORY', `Unsupported category: ${asset.category}`, id);
    assert(typeof asset.mimeType === 'string', 'MIME', 'mimeType is required', id);
    assert(typeof asset.placeholder === 'boolean', 'PLACEHOLDER', 'placeholder must be boolean', id);
    assert(allowedSources.has(asset.source), 'SOURCE', `Unsupported source: ${asset.source}`, id);
    assert(isPlainObject(asset.metadata), 'METADATA', 'metadata must be an object', id);

    const rights = asset.rights;
    assert(isPlainObject(rights), 'RIGHTS', 'rights must be an object', id);
    if (isPlainObject(rights)) {
      const rightsKeys = new Set(['status', 'holder', 'license', 'evidence', 'distribution']);
      for (const key of Object.keys(rights)) {
        assert(rightsKeys.has(key), 'RIGHTS_FIELD', `Unknown rights field: ${key}`, id);
      }
      assert(allowedRights.has(rights.status), 'RIGHTS_STATUS', `Unsupported rights status: ${rights.status}`, id);
      assert(typeof rights.holder === 'string' && rights.holder.trim().length > 0, 'RIGHTS_HOLDER', 'rights.holder is required', id);
      assert(typeof rights.license === 'string' && rights.license.trim().length > 0, 'RIGHTS_LICENSE', 'rights.license is required', id);
      assert(typeof rights.evidence === 'string' && rights.evidence.trim().length > 0, 'RIGHTS_EVIDENCE', 'rights.evidence is required', id);
      assert(typeof rights.distribution === 'string' && rights.distribution.trim().length > 0, 'RIGHTS_DISTRIBUTION', 'rights.distribution is required', id);
      assert(rights.status === 'approved', 'RIGHTS_NOT_APPROVED', 'Only approved assets may be present in the release registry', id);
      if (typeof rights.evidence === 'string' && !/^https:\/\//i.test(rights.evidence)) {
        const evidencePath = resolve(repoRoot, rights.evidence);
        assert(isWithin(repoRoot, evidencePath), 'RIGHTS_EVIDENCE_PATH', `Rights evidence escapes repository: ${rights.evidence}`, id);
        if (isWithin(repoRoot, evidencePath)) {
          try {
            await access(evidencePath);
          } catch {
            problem(errors, 'RIGHTS_EVIDENCE_MISSING', `Rights evidence is missing: ${rights.evidence}`, id);
          }
        }
      }
    }

    const pathValue = asset.path;
    const validPathText = typeof pathValue === 'string'
      && pathValue.startsWith('assets/')
      && !pathValue.includes('\\')
      && !pathValue.split('/').includes('..')
      && !isAbsolute(pathValue);
    assert(validPathText, 'PATH_FORMAT', `Unsafe/invalid path: ${pathValue}`, id);
    if (!validPathText) continue;

    const caseKey = pathValue.toLowerCase();
    assert(!seenPaths.has(caseKey), 'DUPLICATE_PATH', `Duplicate asset path: ${pathValue}`, id);
    seenPaths.add(caseKey);
    const absolutePath = resolve(repoRoot, pathValue);
    assert(isWithin(assetRoot, absolutePath), 'PATH_ESCAPE', `Path escapes asset root: ${pathValue}`, id);
    if (!isWithin(assetRoot, absolutePath)) continue;

    try {
      const stat = await lstat(absolutePath);
      assert(stat.isFile(), 'NOT_FILE', `Asset is not a regular file: ${pathValue}`, id);
      assert(!stat.isSymbolicLink(), 'SYMLINK', `Asset may not be a symlink: ${pathValue}`, id);
      const real = await realpath(absolutePath);
      const realRoot = await realpath(assetRoot);
      assert(isWithin(realRoot, real), 'REALPATH_ESCAPE', `Resolved path escapes asset root: ${pathValue}`, id);
      const content = await readFile(absolutePath);
      const digest = createHash('sha256').update(content).digest('hex');
      assert(Number.isSafeInteger(asset.bytes) && asset.bytes > 0, 'BYTES_FORMAT', 'bytes must be a positive integer', id);
      assert(asset.bytes === content.byteLength, 'BYTES_MISMATCH', `bytes mismatch: manifest=${asset.bytes}, actual=${content.byteLength}`, id);
      assert(/^[a-f0-9]{64}$/.test(asset.sha256 ?? ''), 'HASH_FORMAT', 'sha256 must be 64 lowercase hex characters', id);
      assert(asset.sha256 === digest, 'HASH_MISMATCH', `sha256 mismatch: manifest=${asset.sha256}, actual=${digest}`, id);
      const mime = expectedMime.get(extname(pathValue).toLowerCase());
      if (mime) assert(asset.mimeType === mime, 'MIME_MISMATCH', `Expected ${mime} for ${pathValue}, got ${asset.mimeType}`, id);
      if (extname(pathValue).toLowerCase() === '.svg') {
        const svg = content.toString('utf8');
        assert(/^\s*<svg\b/i.test(svg), 'SVG_ROOT', `SVG root is missing: ${pathValue}`, id);
        assert(!/<\s*(?:script|foreignObject)\b/i.test(svg), 'SVG_ACTIVE_CONTENT', `SVG contains active content: ${pathValue}`, id);
        assert(!/\son[a-z]+\s*=/i.test(svg), 'SVG_EVENT_HANDLER', `SVG contains an event handler: ${pathValue}`, id);
        assert(!/(?:href|src)\s*=\s*["'](?:javascript:|https?:\/\/)|url\(\s*["']?https?:\/\//i.test(svg), 'SVG_EXTERNAL_REFERENCE', `SVG contains an external/script reference: ${pathValue}`, id);
      }
      registeredFiles.add(real.toLowerCase());
    } catch (error) {
      problem(errors, 'ASSET_READ', `Cannot read ${pathValue}: ${error.message}`, id);
    }
  }

  for (const asset of assetRecords) {
    if (!isPlainObject(asset.metadata)) continue;
    for (const key of ['posterAssetId', 'coverAssetId', 'derivedFromAssetId']) {
      const reference = asset.metadata[key];
      if (reference !== undefined) {
        assert(typeof reference === 'string' && seenIds.has(reference), 'ASSET_REFERENCE', `${key} points to an unknown asset: ${reference}`, asset.id);
      }
    }
  }
}

try {
  const files = await listAssetFiles(assetRoot);
  for (const file of files) {
    const real = (await realpath(file)).toLowerCase();
    if (registryFiles.has(real)) continue;
    if (!registeredFiles.has(real)) {
      problem(errors, 'UNREGISTERED_ASSET', `Asset file is not registered: ${relative(repoRoot, file).replaceAll('\\', '/')}`);
    }
  }
} catch (error) {
  problem(errors, 'ASSET_WALK', `Cannot enumerate asset root: ${error.message}`);
}

const report = {
  ok: errors.length === 0,
  manifest: relative(repoRoot, manifestPath).replaceAll('\\', '/'),
  assets: seenIds.size,
  errors,
  warnings
};

if (outputJson) {
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
} else {
  process.stdout.write(`Asset registry: ${report.assets} entries, ${errors.length} error(s), ${warnings.length} warning(s)\n`);
  for (const entry of [...errors, ...warnings]) {
    process.stdout.write(`${errors.includes(entry) ? 'ERROR' : 'WARN'} ${entry.code}${entry.assetId ? ` [${entry.assetId}]` : ''}: ${entry.message}\n`);
  }
}

if (!report.ok) process.exitCode = 1;
