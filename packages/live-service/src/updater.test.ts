import { generateKeyPairSync, sign } from 'node:crypto';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  BackupManager,
  canonicalUpdatePayload,
  compareSemver,
  sha256File,
  validateDownloadedPackage,
  validateUpdateManifest,
  type UpdateManifest,
} from './updater.js';

const cleanup: string[] = [];
afterEach(async () => {
  await Promise.all(cleanup.splice(0).map((directory) => rm(directory, { recursive: true, force: true })));
});

describe('updater safety', () => {
  it('validates version, platform, SHA-256 metadata and Ed25519 signature', () => {
    const { publicKey, privateKey } = generateKeyPairSync('ed25519');
    const unsignedPackage = {
      platform: 'win32' as const,
      arch: 'x64' as const,
      url: 'https://updates.example.test/orbitstage-1.1.0.exe',
      sha256: 'a'.repeat(64),
      sizeBytes: 123,
    };
    const manifest: UpdateManifest = {
      schemaVersion: 1,
      productId: 'orbitstage',
      version: '1.1.0',
      channel: 'stable',
      publishedAt: '2026-06-01T00:00:00.000Z',
      packages: [{ ...unsignedPackage, signature: 'placeholder-signature' }],
    };
    const signature = sign(null, Buffer.from(canonicalUpdatePayload(manifest, manifest.packages[0]!)), privateKey).toString('base64');
    manifest.packages[0] = { ...unsignedPackage, signature };

    const result = validateUpdateManifest(manifest, {
      currentVersion: '1.0.0',
      productId: 'orbitstage',
      arch: 'x64',
      publicKeyPem: publicKey.export({ type: 'spki', format: 'pem' }).toString(),
    });
    expect(result.updateAvailable).toBe(true);
    expect(compareSemver('1.0.0-beta.2', '1.0.0-beta.1')).toBeGreaterThan(0);
  });

  it('checks downloaded file size/hash and restores a constrained backup', async () => {
    const root = await mkdtemp(join(tmpdir(), 'orbitstage-update-test-'));
    cleanup.push(root);
    const app = join(root, 'application');
    const backups = join(root, 'backups');
    await mkdir(app);
    const packagePath = join(root, 'update.bin');
    await writeFile(packagePath, 'trusted update bytes');
    const hash = await sha256File(packagePath);
    await validateDownloadedPackage(packagePath, { sha256: hash, sizeBytes: 20 });

    await writeFile(join(app, 'version.txt'), 'old');
    const manager = new BackupManager(app, backups);
    const backup = await manager.createBackup('before-update');
    await writeFile(join(app, 'version.txt'), 'broken new version');
    await manager.restore(backup.directory);
    expect(await readFile(join(app, 'version.txt'), 'utf8')).toBe('old');
  });
});
