// Sistema i riferimenti assoluti che "expo export" non riscrive da solo per
// i file statici in public/ (manifest.json, apple-touch-icon), e prepara
// dist/ per essere servita da GitHub Pages sotto un sottopercorso:
// - riscrive gli href assoluti con il prefisso del repo
// - copia index.html in 404.html (fallback SPA per le route interne)
// - aggiunge .nojekyll (altrimenti GitHub ignora le cartelle con "_")
const fs = require('fs');
const path = require('path');

const basePath = process.env.EXPO_PUBLIC_BASE_PATH;
if (!basePath) {
  console.error('EXPO_PUBLIC_BASE_PATH non impostata: niente da sistemare.');
  process.exit(1);
}

const distDir = path.join(__dirname, '..', 'dist');

const indexPath = path.join(distDir, 'index.html');
let html = fs.readFileSync(indexPath, 'utf8');
html = html.replace('href="/manifest.json"', `href="${basePath}/manifest.json"`);
html = html.replace('href="/apple-touch-icon.png"', `href="${basePath}/apple-touch-icon.png"`);
fs.writeFileSync(indexPath, html);
fs.writeFileSync(path.join(distDir, '404.html'), html);

const manifestPath = path.join(distDir, 'manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
manifest.start_url = `${basePath}/`;
manifest.icons = manifest.icons.map((icon) => ({ ...icon, src: `${basePath}${icon.src}` }));
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

fs.writeFileSync(path.join(distDir, '.nojekyll'), '');

console.log(`dist/ pronta per GitHub Pages con base path ${basePath}`);
