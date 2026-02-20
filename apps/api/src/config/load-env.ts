import { existsSync } from 'fs';
import { resolve } from 'path';
import { config } from 'dotenv';

const roots = [
  process.cwd(),
  resolve(process.cwd(), 'apps/api'),
  resolve(__dirname, '..', '..'),
];

const envFiles = ['.env.local', '.env'];

for (const root of roots) {
  for (const envFile of envFiles) {
    const fullPath = resolve(root, envFile);
    if (existsSync(fullPath)) {
      config({ path: fullPath, override: false });
    }
  }
}
