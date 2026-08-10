import { createHash, randomUUID } from 'node:crypto';
import { hostname, release, type as osType } from 'node:os';
import { dirname, resolve } from 'node:path';
import { mkdir, rename, writeFile } from 'node:fs/promises';
import type { LiveEvent } from '@orbitstage/shared';
import type { HealthSnapshot } from './health.js';
import { redact, type LogRecord } from './logger.js';

export interface DiagnosticBundleInput {
  appName: string;
  appVersion: string;
  generatedAt?: string;
  health?: HealthSnapshot;
  config?: unknown;
  runtime?: Record<string, unknown>;
  logs?: readonly LogRecord[];
  recentEvents?: readonly LiveEvent[];
  notes?: string;
}

export interface DiagnosticBundleResult {
  path: string;
  sizeBytes: number;
  entries: readonly string[];
}

/** Produces a portable ZIP using store mode and atomically renames it into place. */
export class DiagnosticBundleExporter {
  public async export(filePath: string, input: DiagnosticBundleInput): Promise<DiagnosticBundleResult> {
    const destination = resolve(filePath);
    if (!destination.toLocaleLowerCase().endsWith('.zip')) throw new TypeError('Diagnostic bundle must use a .zip extension');
    await mkdir(dirname(destination), { recursive: true });
    const generatedAt = input.generatedAt ?? new Date().toISOString();
    const safe = redact(input);
    const summary = {
      schemaVersion: 1,
      appName: safe.appName,
      appVersion: safe.appVersion,
      generatedAt,
      environment: {
        platform: process.platform,
        architecture: process.arch,
        os: osType(),
        osRelease: release(),
        hostnameHash: hashHostname(hostname()),
        nodeVersion: process.version,
      },
      health: safe.health,
      config: safe.config,
      runtime: safe.runtime,
      notes: safe.notes,
    };
    const entries: ZipEntry[] = [
      { name: 'summary.json', data: Buffer.from(JSON.stringify(summary, null, 2), 'utf8') },
      {
        name: 'logs.jsonl',
        data: Buffer.from((safe.logs ?? []).map((record) => JSON.stringify(record)).join('\n'), 'utf8'),
      },
      {
        name: 'recent-events.json',
        data: Buffer.from(JSON.stringify(safe.recentEvents ?? [], null, 2), 'utf8'),
      },
      {
        name: 'README.txt',
        data: Buffer.from(
          'OrbitStage diagnostic bundle\r\nSensitive key fields and common credential patterns are redacted. Review before sharing.\r\n',
          'utf8',
        ),
      },
    ];
    const archive = createZip(entries, new Date(generatedAt));
    const temporary = `${destination}.${randomUUID()}.tmp`;
    await writeFile(temporary, archive, { flag: 'wx' });
    await rename(temporary, destination);
    return { path: destination, sizeBytes: archive.byteLength, entries: entries.map((entry) => entry.name) };
  }
}

const hashHostname = (value: string): string => {
  return `host-${createHash('sha256').update(value).digest('hex').slice(0, 16)}`;
};

interface ZipEntry {
  name: string;
  data: Buffer;
}

function createZip(entries: readonly ZipEntry[], timestamp: Date): Buffer {
  const localParts: Buffer[] = [];
  const centralParts: Buffer[] = [];
  let offset = 0;
  const { time, date } = dosDateTime(timestamp);

  for (const entry of entries) {
    const name = Buffer.from(entry.name, 'utf8');
    if (name.length > 0xffff || entry.data.length > 0xffffffff) throw new RangeError('Diagnostic ZIP entry is too large');
    const checksum = crc32(entry.data);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0x0800, 6);
    local.writeUInt16LE(0, 8);
    local.writeUInt16LE(time, 10);
    local.writeUInt16LE(date, 12);
    local.writeUInt32LE(checksum, 14);
    local.writeUInt32LE(entry.data.length, 18);
    local.writeUInt32LE(entry.data.length, 22);
    local.writeUInt16LE(name.length, 26);
    local.writeUInt16LE(0, 28);
    localParts.push(local, name, entry.data);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0x0800, 8);
    central.writeUInt16LE(0, 10);
    central.writeUInt16LE(time, 12);
    central.writeUInt16LE(date, 14);
    central.writeUInt32LE(checksum, 16);
    central.writeUInt32LE(entry.data.length, 20);
    central.writeUInt32LE(entry.data.length, 24);
    central.writeUInt16LE(name.length, 28);
    central.writeUInt16LE(0, 30);
    central.writeUInt16LE(0, 32);
    central.writeUInt16LE(0, 34);
    central.writeUInt16LE(0, 36);
    central.writeUInt32LE(0, 38);
    central.writeUInt32LE(offset, 42);
    centralParts.push(central, name);
    offset += local.length + name.length + entry.data.length;
  }

  const centralDirectory = Buffer.concat(centralParts);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(centralDirectory.length, 12);
  end.writeUInt32LE(offset, 16);
  end.writeUInt16LE(0, 20);
  return Buffer.concat([...localParts, centralDirectory, end]);
}

const dosDateTime = (date: Date): { time: number; date: number } => {
  const year = Math.max(1980, Math.min(2107, date.getUTCFullYear()));
  return {
    time: (date.getUTCHours() << 11) | (date.getUTCMinutes() << 5) | Math.floor(date.getUTCSeconds() / 2),
    date: ((year - 1980) << 9) | ((date.getUTCMonth() + 1) << 5) | date.getUTCDate(),
  };
};

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let index = 0; index < 256; index += 1) {
    let value = index;
    for (let bit = 0; bit < 8; bit += 1) value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    table[index] = value >>> 0;
  }
  return table;
})();

const crc32 = (data: Uint8Array): number => {
  let value = 0xffffffff;
  for (const byte of data) value = (value >>> 8) ^ (CRC_TABLE[(value ^ byte) & 0xff] ?? 0);
  return (value ^ 0xffffffff) >>> 0;
};
