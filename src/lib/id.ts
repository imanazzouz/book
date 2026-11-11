import { randomBytes } from 'node:crypto';

/**
 * UUID v7 (time-ordered). Better index locality than v4 for append-heavy tables.
 * Layout: 48-bit big-endian unix ms | version 7 | 12 random bits | variant 10 | 62 random bits.
 */
export function uuidv7(timestampMs: number = Date.now()): string {
  const bytes = randomBytes(16);
  const ts = Math.floor(timestampMs);

  bytes[0] = Math.floor(ts / 2 ** 40) & 0xff;
  bytes[1] = Math.floor(ts / 2 ** 32) & 0xff;
  bytes[2] = Math.floor(ts / 2 ** 24) & 0xff;
  bytes[3] = Math.floor(ts / 2 ** 16) & 0xff;
  bytes[4] = Math.floor(ts / 2 ** 8) & 0xff;
  bytes[5] = ts & 0xff;

  bytes[6] = ((bytes[6] ?? 0) & 0x0f) | 0x70;
  bytes[8] = ((bytes[8] ?? 0) & 0x3f) | 0x80;

  const hex = bytes.toString('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
