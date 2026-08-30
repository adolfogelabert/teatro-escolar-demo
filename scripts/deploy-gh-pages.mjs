/**
 * Deploy manual a GitHub Pages (mientras GitHub Actions esté bloqueado).
 * Uso: node scripts/deploy-gh-pages.mjs
 *
 * Crea/actualiza el branch gh-pages con el contenido de dist/.
 * GitHub Pages debe estar configurado para servir desde ese branch.
 */
import { execSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '..');
const distDir = resolve(projectRoot, 'dist');

if (!existsSync(distDir)) {
  console.error('❌ No existe dist/. Ejecuta primero: npm run build');
  process.exit(1);
}

function run(cmd) {
  console.log(`> ${cmd}`);
  execSync(cmd, { cwd: projectRoot, stdio: 'inherit' });
}

console.log('\n🚀 Desplegando a GitHub Pages (branch gh-pages)...\n');

// 1. Build
run('npm run build');

// 2. Crear commit temporal con dist/
run('git add -f dist/');
try {
  run('git commit -m "deploy: actualizar gh-pages"');
} catch {
  console.log('ℹ️  No hay cambios en dist/ para commitear.');
}

// 3. Subir dist/ al branch gh-pages usando git subtree
console.log('\n📤 Enviando a gh-pages...');
try {
  // Crear branch gh-pages a partir del subtree dist/
  const subtreeHash = execSync('git subtree split --prefix dist main', {
    cwd: projectRoot,
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe'],
  }).trim();
  console.log(`> git push origin ${subtreeHash}:refs/heads/gh-pages --force`);
  execSync(`git push origin ${subtreeHash}:refs/heads/gh-pages --force`, {
    cwd: projectRoot,
    stdio: 'inherit',
  });
  console.log('\n✅ ¡Desplegado! Verifica en: https://adolfogelabert.github.io/teatro-escolar-demo/');
} catch (e) {
  console.error('\n❌ Error al hacer push a gh-pages:', e.message);
  console.log('\nAlternativa manual:');
  console.log('  1. git subtree split --prefix dist main -b gh-pages');
  console.log('  2. git push origin gh-pages --force');
  process.exit(1);
}

// 4. Limpiar: quitar dist/ del staging
run('git reset HEAD dist/');
console.log('\n🧹 Limpieza completada.');
