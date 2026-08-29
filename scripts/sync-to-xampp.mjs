import { cpSync, copyFileSync, existsSync, rmSync, statSync, readdirSync } from 'node:fs';
import { resolve, dirname, basename, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '..');

const distDir = resolve(projectRoot, 'dist');

/**
 * Resolución automática del directorio destino en XAMPP/Apache.
 *
 * Prioridad:
 * 1. Variable de entorno XAMPP_DIR (override explícito).
 * 2. Si el proyecto vive bajo "C:/xampp/htdocs/<nombre>/" se usa esa ruta.
 * 3. Fallback a './public/' relativo al proyecto (para hosting estático).
 */
function resolveXamppDir() {
  if (process.env.XAMPP_DIR) return process.env.XAMPP_DIR;
  const lower = projectRoot.toLowerCase();
  const xamppMarker = `${sep}xampp${sep}htdocs${sep}`;
  const idx = lower.lastIndexOf(xamppMarker);
  if (idx !== -1) {
    return projectRoot; // Ya vive en htdocs/<nombre>, usamos esa misma carpeta
  }
  return resolve(projectRoot, 'public');
}

const xamppDir = resolveXamppDir();
const projectName = basename(projectRoot);

if (!existsSync(distDir)) {
  console.error(`\u274c No se encontr\u00f3 ${distDir}. Ejecuta primero "npm run build".`);
  process.exit(1);
}

const safeRemove = (target) => {
  if (!existsSync(target)) return;
  const stat = statSync(target);
  if (stat.isDirectory()) {
    rmSync(target, { recursive: true, force: true });
  } else {
    rmSync(target, { force: true });
  }
};

const itemsToSync = readdirSync(distDir).filter(
  (entry) => entry === 'index.html' || entry === 'assets' || entry.endsWith('.htaccess')
);

for (const item of itemsToSync) {
  const source = resolve(distDir, item);
  const target = resolve(xamppDir, item);
  safeRemove(target);
  cpSync(source, target, { recursive: true });
  console.log(`  \u2192 ${item}`);
}

const isUnderHtdocs = projectRoot.toLowerCase().includes(`${sep}xampp${sep}htdocs${sep}`);
console.log(`\n\u2705 Sincronizado dist/ \u2192 ${xamppDir}`);
if (isUnderHtdocs) {
  console.log(`\n\ud83d\udc49 Disponible ahora en: http://localhost/${projectName}/ (si usas XAMPP con proyecto en htdocs/${projectName})`);
} else {
  console.log(`\n\ud83d\udc49 Archivos sincronizados en ${xamppDir}. Configura tu servidor para servirlos.`);
}
console.log('\ud83d\udc49 Para volver a desarrollo: npm run dev');
