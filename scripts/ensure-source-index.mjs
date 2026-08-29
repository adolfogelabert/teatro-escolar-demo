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
const current = existsSync(targetPath) ? readFileSync(targetPath, 'utf8') : '';

if (current === template) {
  console.log('\u2705 index.html ya coincide con el template fuente.');
  process.exit(0);
}

if (!existsSync(targetPath)) {
  console.log('\ud83d\udcdd Creando index.html desde el template fuente...');
} else {
  console.log('\ud83d\udd04 Restaurando index.html desde el template fuente...');
}

writeFileSync(targetPath, template, 'utf8');
console.log('\u2705 index.html sincronizado con templates/source-index.html');
