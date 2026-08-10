import { createHash, createPublicKey, randomUUID, verify as verifySignature } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { cp, mkdir, readFile, rename, rm, stat, writeFile } from 'node:fs/promises';
import { basename, dirname, isAbsolute, join, relative, resolve } from 'node:path';
import { pipeline } from 'node:stream/promises';
import { Writable } from 'node:stream';
import { z } from 'zod';

const SemverSchema = z.string().regex(/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/);
const Sha256Schema = z.string().regex(/^[a-f0-9]{64}$/i).transform((value) => value.toLowerCase());

export const UpdatePackageSchema = z.object({
  platform: z.literal('win32'),
  arch: z.enum(['x64', 'arm64']),
  url: z.string().url(),
  sha256: Sha256Schema,
  sizeBytes: z.number().int().positive(),
  signature: z.string().min(16).max(16_384).optional(),
});

export const UpdateManifestSchema = z.object({
  schemaVersion: z.literal(1),
  productId: z.string().trim().min(1).max(100),
  version: SemverSchema,
  channel: z.enum(['stable', 'beta']),
  publishedAt: z.string().datetime({ offset: true }),
  minimumVersion: SemverSchema.optional(),
  releaseNotes: z.string().max(20_000).optional(),
  packages: z.array(UpdatePackageSchema).min(1),
});

export type UpdateManifest = z.infer<typeof UpdateManifestSchema>;
export type UpdatePackage = z.infer<typeof UpdatePackageSchema>;

export interface ValidateUpdateOptions {
  currentVersion: string;
  productId: string;
  arch: 'x64' | 'arm64';
  channel?: 'stable' | 'beta';
  requireSignature?: boolean;
  publicKeyPem?: string;
  allowInsecureLoopback?: boolean;
}

export interface ValidatedUpdate {
  manifest: UpdateManifest;
  package: UpdatePackage;
  updateAvailable: boolean;
}

export class UpdateValidationError extends Error {
  public constructor(
    message: string,
    public readonly code:
      | 'invalid-manifest'
      | 'wrong-product'
      | 'wrong-channel'
      | 'no-package'
      | 'insecure-url'
      | 'missing-signature'
      | 'invalid-signature'
      | 'downgrade-blocked'
      | 'hash-mismatch'
      | 'size-mismatch',
  ) {
    super(message);
    this.name = 'UpdateValidationError';
  }
}

export function validateUpdateManifest(input: unknown, options: ValidateUpdateOptions): ValidatedUpdate {
  const parsed = UpdateManifestSchema.safeParse(input);
  if (!parsed.success) throw new UpdateValidationError(parsed.error.message, 'invalid-manifest');
  const manifest = parsed.data;
  if (manifest.productId !== options.productId) throw new UpdateValidationError('Update product id does not match', 'wrong-product');
  if (options.channel && manifest.channel !== options.channel) throw new UpdateValidationError('Update channel does not match', 'wrong-channel');
  const selectedPackage = manifest.packages.find((entry) => entry.platform === 'win32' && entry.arch === options.arch);
  if (!selectedPackage) throw new UpdateValidationError(`No Windows ${options.arch} package in manifest`, 'no-package');
  const packageUrl = new URL(selectedPackage.url);
  if (packageUrl.protocol !== 'https:' && !(options.allowInsecureLoopback && isLoopback(packageUrl))) {
    throw new UpdateValidationError('Update package URL must use HTTPS', 'insecure-url');
  }
  const requireSignature = options.requireSignature ?? true;
  if (requireSignature && (!selectedPackage.signature || !options.publicKeyPem)) {
    throw new UpdateValidationError('Signed update and public key are required', 'missing-signature');
  }
  if (selectedPackage.signature && options.publicKeyPem && !verifyUpdateSignature(manifest, selectedPackage, options.publicKeyPem)) {
    throw new UpdateValidationError('Update package signature is invalid', 'invalid-signature');
  }
  const comparison = compareSemver(manifest.version, options.currentVersion);
  return { manifest, package: selectedPackage, updateAvailable: comparison > 0 };
}

export function verifyUpdateSignature(manifest: UpdateManifest, updatePackage: UpdatePackage, publicKeyPem: string): boolean {
  try {
    const key = createPublicKey(publicKeyPem);
    const payload = Buffer.from(canonicalUpdatePayload(manifest, updatePackage));
    const signature = Buffer.from(updatePackage.signature ?? '', 'base64');
    const algorithm = key.asymmetricKeyType === 'ed25519' || key.asymmetricKeyType === 'ed448' ? null : 'sha256';
    return verifySignature(algorithm, payload, key, signature);
  } catch {
    return false;
  }
}

export const canonicalUpdatePayload = (manifest: UpdateManifest, updatePackage: UpdatePackage): string =>
  JSON.stringify({
    schemaVersion: manifest.schemaVersion,
    productId: manifest.productId,
    version: manifest.version,
    channel: manifest.channel,
    publishedAt: manifest.publishedAt,
    platform: updatePackage.platform,
    arch: updatePackage.arch,
    url: updatePackage.url,
    sha256: updatePackage.sha256,
    sizeBytes: updatePackage.sizeBytes,
  });

export function compareSemver(left: string, right: string): number {
  const a = parseSemver(left);
  const b = parseSemver(right);
  for (let index = 0; index < 3; index += 1) {
    const difference = (a.core[index] ?? 0) - (b.core[index] ?? 0);
    if (difference !== 0) return Math.sign(difference);
  }
  if (a.pre.length === 0 && b.pre.length > 0) return 1;
  if (a.pre.length > 0 && b.pre.length === 0) return -1;
  for (let index = 0; index < Math.max(a.pre.length, b.pre.length); index += 1) {
    const av = a.pre[index];
    const bv = b.pre[index];
    if (av === undefined) return -1;
    if (bv === undefined) return 1;
    if (av === bv) continue;
    const an = /^\d+$/.test(av) ? Number(av) : undefined;
    const bn = /^\d+$/.test(bv) ? Number(bv) : undefined;
    if (an !== undefined && bn !== undefined) return Math.sign(an - bn);
    if (an !== undefined) return -1;
    if (bn !== undefined) return 1;
    return av.localeCompare(bv);
  }
  return 0;
}

const parseSemver = (version: string): { core: number[]; pre: string[] } => {
  if (!SemverSchema.safeParse(version).success) throw new UpdateValidationError(`Invalid semantic version: ${version}`, 'invalid-manifest');
  const [withoutBuild] = version.split('+');
  const [core = '', pre = ''] = withoutBuild!.split('-');
  return { core: core.split('.').map(Number), pre: pre ? pre.split('.') : [] };
};

const isLoopback = (url: URL): boolean =>
  url.hostname === '127.0.0.1' || url.hostname === 'localhost' || url.hostname === '::1' || url.hostname === '[::1]';

export async function sha256File(filePath: string): Promise<string> {
  const hash = createHash('sha256');
  await pipeline(
    createReadStream(filePath),
    new Writable({
      write(chunk: Buffer, _encoding, callback) {
        hash.update(chunk);
        callback();
      },
    }),
  );
  return hash.digest('hex');
}

export async function validateDownloadedPackage(filePath: string, expected: Pick<UpdatePackage, 'sha256' | 'sizeBytes'>): Promise<void> {
  const info = await stat(filePath);
  if (!info.isFile() || info.size !== expected.sizeBytes) throw new UpdateValidationError('Downloaded update size does not match', 'size-mismatch');
  const actualHash = await sha256File(filePath);
  if (actualHash.toLowerCase() !== expected.sha256.toLowerCase()) {
    throw new UpdateValidationError('Downloaded update SHA-256 does not match', 'hash-mismatch');
  }
}

export interface BackupMetadata {
  schemaVersion: 1;
  id: string;
  sourceDirectory: string;
  createdAt: string;
}

export interface BackupRecord {
  directory: string;
  metadata: BackupMetadata;
}

/** Constrained backup/rollback helper: it can only restore the exact application directory supplied at construction. */
export class BackupManager {
  private readonly applicationDirectory: string;
  private readonly backupRoot: string;

  public constructor(applicationDirectory: string, backupRoot: string) {
    this.applicationDirectory = resolve(applicationDirectory);
    this.backupRoot = resolve(backupRoot);
    assertSafeDirectory(this.applicationDirectory, 'applicationDirectory');
    assertSafeDirectory(this.backupRoot, 'backupRoot');
    if (this.applicationDirectory === this.backupRoot || isPathInside(this.applicationDirectory, this.backupRoot)) {
      throw new TypeError('backupRoot cannot equal or be inside applicationDirectory');
    }
  }

  public async createBackup(id = `${Date.now()}-${randomUUID()}`): Promise<BackupRecord> {
    if (!/^[a-zA-Z0-9._-]{1,200}$/.test(id)) throw new TypeError('Invalid backup id');
    const sourceInfo = await stat(this.applicationDirectory);
    if (!sourceInfo.isDirectory()) throw new TypeError('Application path is not a directory');
    await mkdir(this.backupRoot, { recursive: true });
    const destination = resolve(this.backupRoot, id);
    assertInside(this.backupRoot, destination);
    try {
      await stat(destination);
      throw new TypeError(`Backup already exists: ${id}`);
    } catch (error) {
      if (error instanceof TypeError) throw error;
    }
    await mkdir(destination, { recursive: false });
    const contentDirectory = join(destination, 'app');
    try {
      await cp(this.applicationDirectory, contentDirectory, { recursive: true, errorOnExist: true, force: false });
      const metadata: BackupMetadata = {
        schemaVersion: 1,
        id,
        sourceDirectory: this.applicationDirectory,
        createdAt: new Date().toISOString(),
      };
      await writeFile(join(destination, 'backup.json'), JSON.stringify(metadata, null, 2), { encoding: 'utf8', flag: 'wx' });
      return { directory: destination, metadata };
    } catch (error) {
      await rm(destination, { recursive: true, force: true });
      throw error;
    }
  }

  public async readBackup(backupDirectory: string): Promise<BackupRecord> {
    const directory = resolve(backupDirectory);
    assertInside(this.backupRoot, directory);
    const metadata = JSON.parse(await readFile(join(directory, 'backup.json'), 'utf8')) as BackupMetadata;
    if (metadata.schemaVersion !== 1 || metadata.sourceDirectory !== this.applicationDirectory || !metadata.id) {
      throw new TypeError('Backup metadata does not match this application');
    }
    const content = await stat(join(directory, 'app'));
    if (!content.isDirectory()) throw new TypeError('Backup content is missing');
    return { directory, metadata };
  }

  public async restore(backupDirectory: string): Promise<void> {
    const backup = await this.readBackup(backupDirectory);
    const parent = dirname(this.applicationDirectory);
    const quarantine = resolve(parent, `.${basename(this.applicationDirectory)}.rollback-${randomUUID()}`);
    assertInside(parent, quarantine);
    await rename(this.applicationDirectory, quarantine);
    try {
      await cp(join(backup.directory, 'app'), this.applicationDirectory, { recursive: true, errorOnExist: true, force: false });
    } catch (error) {
      await rm(this.applicationDirectory, { recursive: true, force: true });
      await rename(quarantine, this.applicationDirectory);
      throw error;
    }
    await rm(quarantine, { recursive: true, force: true });
  }
}

const assertSafeDirectory = (directory: string, label: string): void => {
  if (!isAbsolute(directory)) throw new TypeError(`${label} must be absolute`);
  const root = resolve(directory, '..');
  if (directory === resolve(directory, '/') || directory === root) throw new TypeError(`${label} cannot be a filesystem root`);
  if (directory.length < 4) throw new TypeError(`${label} is too broad`);
};

const isPathInside = (parent: string, candidate: string): boolean => {
  const value = relative(parent, candidate);
  return value !== '' && !value.startsWith('..') && !isAbsolute(value);
};

const assertInside = (parent: string, candidate: string): void => {
  if (!isPathInside(parent, candidate)) throw new TypeError('Path escapes the allowed directory');
};
