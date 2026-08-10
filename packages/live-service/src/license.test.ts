import { describe, expect, it } from 'vitest';
import { LicenseService, type LicenseRecord } from './license.js';

const record: LicenseRecord = {
  licenseId: 'license-1',
  productId: 'orbitstage',
  deviceId: 'device-hash',
  issuedAt: '2026-01-01T00:00:00.000Z',
  expiresAt: '2027-01-01T00:00:00.000Z',
  lastValidatedAt: '2026-06-01T00:00:00.000Z',
  offlineUntil: '2026-06-04T00:00:00.000Z',
  signature: 'signed-payload-placeholder',
};

describe('LicenseService', () => {
  it('is a separate module disabled by default and allows free use', async () => {
    const service = new LicenseService();
    expect(await service.check()).toEqual({
      enabled: false,
      allowed: true,
      state: 'free',
      message: expect.stringContaining('free'),
    });
  });

  it('enforces signed device/product/offline policy when explicitly enabled', async () => {
    let stored: unknown = record;
    const service = new LicenseService({
      enabled: true,
      productId: 'orbitstage',
      deviceId: 'device-hash',
      storage: {
        load: async () => stored,
        save: async (value) => {
          stored = value;
        },
        clear: async () => {
          stored = undefined;
        },
      },
      verifier: { verify: () => true },
      clock: { now: () => Date.parse('2026-06-02T00:00:00.000Z') },
    });

    expect(await service.check()).toMatchObject({ allowed: true, state: 'offline-grace' });
  });
});
