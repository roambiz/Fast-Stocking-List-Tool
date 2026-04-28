import archiver from 'archiver';
import { createWriteStream, readFileSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const distDir = path.join(root, 'dist');

const pkg = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'));
const version = pkg.version ?? '0.0.0';

const outDir = path.join(root, 'release');
const outFile = path.join(outDir, `fast-stocking-list-v${version}-dist.zip`);

await mkdir(outDir, { recursive: true });

await new Promise((resolve, reject) => {
  const output = createWriteStream(outFile);
  const archive = archiver('zip', { zlib: { level: 9 } });
  output.on('close', () => resolve());
  archive.on('error', reject);
  archive.pipe(output);
  archive.directory(distDir, false);
  archive.finalize();
});

console.log(`Dist zip: ${outFile}`);

