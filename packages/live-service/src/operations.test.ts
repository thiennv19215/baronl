import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { DiagnosticBundleExporter } from './diagnostics.js';
import { HealthRegistry } from './health.js';
import { MemoryLogSink, StructuredLogger, redact } from './logger.js';

const cleanup: string[] = [];
afterEach(async () => {
  await Promise.all(cleanup.splice(0).map((directory) => rm(directory, { recursive: true, force: true })));
});

describe('operations hardening', () => {
  it('redacts structured fields, bearer tokens, key patterns and circular data', () => {
    const circular: Record<string, unknown> = { apiKey: 'arbitrary-value', message: 'Bearer abc.def.ghi and sk-abcdefghijk' };
    circular.self = circular;
    const safe = redact(circular);
    expect(safe).toMatchObject({ apiKey: '[REDACTED]', self: '[Circular]' });
    expect(JSON.stringify(safe)).not.toContain('abc.def.ghi');
    expect(JSON.stringify(safe)).not.toContain('sk-abcdefghijk');
  });

  it('runs health probes and exports a ZIP with redacted logs/config', async () => {
    const health = new HealthRegistry();
    health.register('service', () => true, { critical: true });
    health.register('optional-ai', () => ({ status: 'warn', message: 'disabled' }));
    const snapshot = await health.checkAll();
    expect(snapshot.status).toBe('warn');

    const sink = new MemoryLogSink();
    const logger = new StructuredLogger(sink.write);
    logger.info('Authorization: Bearer top.secret.token', { apiKey: 'do-not-export', port: 17_321 });
    const root = await mkdtemp(join(tmpdir(), 'orbitstage-diagnostics-test-'));
    cleanup.push(root);
    const destination = join(root, 'diagnostics.zip');
    const result = await new DiagnosticBundleExporter().export(destination, {
      appName: 'OrbitStage',
      appVersion: '1.0.0',
      health: snapshot,
      config: { password: 'private-password', enabled: true },
      logs: sink.snapshot(),
    });
    const bytes = await readFile(destination);
    expect(bytes.readUInt32LE(0)).toBe(0x04034b50);
    expect(bytes.toString('utf8')).not.toContain('private-password');
    expect(bytes.toString('utf8')).not.toContain('top.secret.token');
    expect(result.entries).toContain('summary.json');
  });
});
