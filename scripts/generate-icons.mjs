import sharp from 'sharp';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const dir = new URL('../public/', import.meta.url);
const read = (name) => readFileSync(new URL(name, dir));

async function make(srcName, outName, size) {
  await sharp(read(srcName)).resize(size, size).png().toFile(fileURLToPath(new URL(outName, dir)));
}

await make('icon-192.svg', 'icon-192.png', 192);
await make('icon-512.svg', 'icon-512.png', 512);
await make('icon-maskable.svg', 'icon-maskable-192.png', 192);
await make('icon-maskable.svg', 'icon-maskable-512.png', 512);
await make('icon-192.svg', 'apple-touch-icon.png', 180);
await make('favicon.svg', 'favicon.png', 64);
console.log('Icons generated.');
