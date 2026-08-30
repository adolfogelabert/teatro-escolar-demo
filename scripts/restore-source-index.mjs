import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '..');

const templatePath = resolve(projectRoot, 'templates/source-index.html');
const targetPath = resolve(projectRoot, 'index.html');

if (!existsSync(templatePath)) {
  console.error(`\u274c No existe el template en ${templatePath}`);
  process.exit(1);
}

const template = readFileSync(templatePath, 'utf8');
writeFileSync(targetPath, template, 'utf8');
console.log('\u2705 index.html restaurado a versión fuente (post-build).');
