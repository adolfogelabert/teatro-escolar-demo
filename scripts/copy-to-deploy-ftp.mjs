import { rmSync, cpSync, existsSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const projectRoot = resolve(__dirname, '..');
const distDir = resolve(projectRoot, 'dist');
const deployDir = resolve(projectRoot, 'deploy-ftp');

if (!existsSync(distDir)) {
  console.error(`\u274c No se encontró el directorio ${distDir}. Ejecuta primero "npm run build".`);
  process.exit(1);
}

if (!existsSync(deployDir)) {
  mkdirSync(deployDir, { recursive: true });
}

// Limpia solo los archivos generados (preserva .htaccess si existe)
for (const entry of readdirSync(deployDir)) {
  if (entry === '.htaccess') continue;
  const target = resolve(deployDir, entry);
  rmSync(target, { recursive: true, force: true });
}

const copyRecursive = (src, dest) => {
  const stats = statSync(src);
  if (stats.isDirectory()) {
    if (!existsSync(dest)) mkdirSync(dest, { recursive: true });
    for (const child of readdirSync(src)) {
      copyRecursive(resolve(src, child), resolve(dest, child));
    }
  } else {
    cpSync(src, dest);
  }
};

copyRecursive(distDir, deployDir);

console.log(`\u2705 deploy-ftp/ regenerado desde dist/`);
console.log(`   Origen:  ${distDir}`);
console.log(`   Destino: ${deployDir}`);
