/**
 * Asset guard: every shipped image must be documented, committed as WebP and
 * free of metadata that leaks camera/GPS data.
 *
 *   npm run check:images
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { extname, join } from 'node:path';

const IMAGE_DIRS = ['public/images'];
const LICENSES = 'docs/asset-licenses.md';
const MAX_BYTES = 600 * 1024;

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

function main() {
  const licenses = readFileSync(LICENSES, 'utf8');
  const files = IMAGE_DIRS.flatMap(walk);
  const problems: string[] = [];

  for (const file of files) {
    const relative = file.replace(/^public\//, '');
    const extension = extname(file).toLowerCase();
    const bytes = readFileSync(file);

    if (extension !== '.webp') {
      problems.push(`${file}: only WebP is allowed (found ${extension || 'no extension'})`);
      continue;
    }
    if (!licenses.includes(relative)) {
      problems.push(`${file}: missing an entry in ${LICENSES}`);
    }
    if (Buffer.byteLength(bytes) > MAX_BYTES) {
      problems.push(`${file}: ${(Buffer.byteLength(bytes) / 1024).toFixed(0)} KB exceeds 600 KB`);
    }
    if (
      bytes.subarray(0, 4).toString('ascii') !== 'RIFF' ||
      bytes.subarray(8, 12).toString('ascii') !== 'WEBP'
    ) {
      problems.push(`${file}: not a valid WebP container`);
    }
    // A WebP with an EXIF/XMP chunk would still carry camera or GPS metadata.
    if (bytes.includes('EXIF') || bytes.includes('http://ns.adobe.com/xap/1.0/')) {
      problems.push(`${file}: still contains EXIF/XMP metadata`);
    }
  }

  if (problems.length > 0) {
    console.error(`Image audit failed (${problems.length}):`);
    for (const problem of problems) console.error(`  - ${problem}`);
    process.exitCode = 1;
    return;
  }

  console.log(`Image audit passed: ${files.length} files documented, WebP, ≤ 600 KB, no EXIF.`);
}

main();
