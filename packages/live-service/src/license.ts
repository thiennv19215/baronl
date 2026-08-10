import { createPublicKey, verify as verifySignature } from 'node:crypto';
import { z } from 'zod';
import { NOOP_LOGGER, SYSTEM_CLOCK, type Clock, type Logger } from './types.js';

export const LicenseRecordSchema = z.object({
  licenseId: z.string().trim().min(1).max(200),
  productId: z.string().trim().min(1).max(100),
  deviceId: z.string().trim().min(1).max(256),
  issuedAt: z.string().datetime({ offset: true }),
  expiresAt: z.string().datetime({ offset: true }).nullable(),
  lastValidatedAt: z.string().datetime({ offset: true }),
  offlineUntil: z.string().datetime({ offset: true }),
  signature: z.string().min(16).max(8_192),
});
export type LicenseRecord = z.infer<typeof LicenseRecordSchema>;

export interface LicenseStorage {
  load(): Promise<unknown | undefined>;
  save(record: LicenseRecord): Promise<void>;
  clear(): Promise<void>;
}

export interface LicenseAuthority {
  activate(activationKey: string, context: { productId: string; deviceId: string }): Promise<unknown>;
  refresh(record: LicenseRecord): Promise<unknown>;
}

export interface LicenseRecordVerifier {
  verify(record: LicenseRecord): Promise<boolean> | boolean;
}

export interface LicenseServiceOptions {
  enabled?: boolean;
  productId?: string;
  deviceId?: string;
  storage?: LicenseStorage;
  authority?: LicenseAuthority;
  verifier?: LicenseRecordVerifier;
  clock?: Clock;
  logger?: Logger;
}

export type LicenseState = 'free' | 'active' | 'offline-grace' | 'missing' | 'expired' | 'invalid' | 'error';

export interface LicenseStatus {
  enabled: boolean;
  allowed: boolean;
  state: LicenseState;
  expiresAt?: string | null;
  offlineUntil?: string;
  message: string;
}

const FREE_STATUS: LicenseStatus = {
  enabled: false,
  allowed: true,
  state: 'free',
  message: 'License module is disabled; the application is free to use.',
};

/** Separate, opt-in licensing boundary. Disabled is a first-class free mode, never a bypass path. */
export class LicenseService {
  private readonly enabled: boolean;
  private readonly clock: Clock;
  private readonly logger: Logger;
  private mutableStatus: LicenseStatus;

  public constructor(private readonly options: LicenseServiceOptions = {}) {
    this.enabled = options.enabled ?? false;
    this.clock = options.clock ?? SYSTEM_CLOCK;
    this.logger = options.logger ?? NOOP_LOGGER;
    if (this.enabled && (!options.productId || !options.deviceId || !options.storage || !options.verifier)) {
      throw new TypeError('Enabled licensing requires productId, deviceId, storage and verifier');
    }
    this.mutableStatus = this.enabled
      ? { enabled: true, allowed: false, state: 'missing', message: 'No license has been activated.' }
      : FREE_STATUS;
  }

  public get status(): LicenseStatus {
    return { ...this.mutableStatus };
  }

  public async check(options: { online?: boolean } = {}): Promise<LicenseStatus> {
    if (!this.enabled) return this.set(FREE_STATUS);
    let input: unknown;
    try {
      input = await this.options.storage!.load();
    } catch (error) {
      this.logger.error('Unable to load license state', { error });
      return this.set({ enabled: true, allowed: false, state: 'error', message: 'License state could not be loaded.' });
    }
    if (input === undefined) {
      return this.set({ enabled: true, allowed: false, state: 'missing', message: 'No license has been activated.' });
    }
    const parsed = LicenseRecordSchema.safeParse(input);
    if (!parsed.success || !(await this.verify(parsed.data))) {
      return this.set({ enabled: true, allowed: false, state: 'invalid', message: 'The stored license is invalid.' });
    }
    let record = parsed.data;
    if (record.productId !== this.options.productId || record.deviceId !== this.options.deviceId) {
      return this.set({ enabled: true, allowed: false, state: 'invalid', message: 'The license does not match this product or device.' });
    }

    if (options.online && this.options.authority) {
      try {
        const refreshed = LicenseRecordSchema.parse(await this.options.authority.refresh(record));
        if (!(await this.verify(refreshed))) throw new Error('Invalid license authority signature');
        await this.options.storage!.save(refreshed);
        record = refreshed;
      } catch (error) {
        this.logger.warn('Online license refresh failed; evaluating signed offline policy', { error });
      }
    }
    return this.evaluate(record);
  }

  public async activate(activationKey: string): Promise<LicenseStatus> {
    if (!this.enabled) return this.set(FREE_STATUS);
    const key = activationKey.trim();
    if (!key || key.length > 1_024) {
      return this.set({ enabled: true, allowed: false, state: 'invalid', message: 'Activation key format is invalid.' });
    }
    if (!this.options.authority) {
      return this.set({ enabled: true, allowed: false, state: 'error', message: 'License activation service is not configured.' });
    }
    try {
      const record = LicenseRecordSchema.parse(
        await this.options.authority.activate(key, { productId: this.options.productId!, deviceId: this.options.deviceId! }),
      );
      if (!(await this.verify(record))) {
        return this.set({ enabled: true, allowed: false, state: 'invalid', message: 'License server response signature is invalid.' });
      }
      if (record.productId !== this.options.productId || record.deviceId !== this.options.deviceId) {
        return this.set({ enabled: true, allowed: false, state: 'invalid', message: 'License response does not match this device.' });
      }
      await this.options.storage!.save(record);
      return this.evaluate(record);
    } catch (error) {
      this.logger.warn('License activation failed', { error });
      return this.set({ enabled: true, allowed: false, state: 'error', message: 'Activation failed. Check the connection and key.' });
    }
  }

  public async deactivateLocal(): Promise<LicenseStatus> {
    if (!this.enabled) return this.set(FREE_STATUS);
    await this.options.storage!.clear();
    return this.set({ enabled: true, allowed: false, state: 'missing', message: 'Local activation was removed.' });
  }

  private evaluate(record: LicenseRecord): LicenseStatus {
    const now = this.clock.now();
    const expiresAt = record.expiresAt === null ? null : Date.parse(record.expiresAt);
    if (expiresAt !== null && expiresAt <= now) {
      return this.set({ enabled: true, allowed: false, state: 'expired', expiresAt: record.expiresAt, message: 'The license has expired.' });
    }
    if (Date.parse(record.offlineUntil) < now) {
      return this.set({
        enabled: true,
        allowed: false,
        state: 'expired',
        expiresAt: record.expiresAt,
        offlineUntil: record.offlineUntil,
        message: 'Online license verification is required.',
      });
    }
    const recentlyOnline = Date.parse(record.lastValidatedAt) >= now - 5 * 60_000;
    return this.set({
      enabled: true,
      allowed: true,
      state: recentlyOnline ? 'active' : 'offline-grace',
      expiresAt: record.expiresAt,
      offlineUntil: record.offlineUntil,
      message: recentlyOnline ? 'License is active.' : 'License is valid in the signed offline grace period.',
    });
  }

  private async verify(record: LicenseRecord): Promise<boolean> {
    try {
      return await this.options.verifier!.verify(record);
    } catch (error) {
      this.logger.warn('License signature verification failed', { error });
      return false;
    }
  }

  private set(status: LicenseStatus): LicenseStatus {
    this.mutableStatus = { ...status };
    return this.status;
  }
}

export class SignedLicenseVerifier implements LicenseRecordVerifier {
  private readonly key;

  public constructor(publicKeyPem: string) {
    this.key = createPublicKey(publicKeyPem);
  }

  public verify(record: LicenseRecord): boolean {
    try {
      const { signature, ...claims } = record;
      const payload = Buffer.from(canonicalJson(claims));
      const signatureBytes = Buffer.from(signature, 'base64');
      const algorithm = this.key.asymmetricKeyType === 'ed25519' || this.key.asymmetricKeyType === 'ed448' ? null : 'sha256';
      return verifySignature(algorithm, payload, this.key, signatureBytes);
    } catch {
      return false;
    }
  }
}

const canonicalJson = (value: unknown): string => {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  const object = value as Record<string, unknown>;
  return `{${Object.keys(object)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${canonicalJson(object[key])}`)
    .join(',')}}`;
};
