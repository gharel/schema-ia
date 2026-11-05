/**
 * npm run icones : dérive de site/favicon.svg les icônes PNG des navigateurs qui ne lisent pas le
 * SVG (favicon-32.png) et l'icône de l'écran d'accueil d'iOS (apple-touch-icon.png, 180 px, fond
 * blanc plein : iOS arrondit lui-même les coins).
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const SITE = fileURLToPath(new URL('../site/', import.meta.url));
const favicon = readFileSync(`${SITE}favicon.svg`, 'utf8');
// iOS : carré blanc sans filet, le pictogramme un peu plus petit pour respirer dans le masque arrondi.
const pourIos = favicon
  .replace(/<rect[^>]*\/>/, '<rect width="64" height="64" fill="#ffffff"/>')
  .replace('stroke="#ffffff"', 'stroke="#0a9396"')
  .replace(
    '<g transform="translate(12.8 12.8) scale(1.6)"',
    '<g transform="translate(14.4 14.4) scale(1.4)"',
  );

const navigateur = await chromium.launch();
const page = await navigateur.newPage();
for (const [svg, taille, nom, transparent] of [
  [favicon, 32, 'favicon-32.png', true],
  [pourIos, 180, 'apple-touch-icon.png', false],
]) {
  await page.setViewportSize({ width: taille, height: taille });
  const source = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
  await page.setContent(
    `<style>html,body{margin:0;background:transparent}</style><img src="${source}" width="${taille}" height="${taille}" style="display:block">`,
  );
  await page.locator('img').screenshot({ path: `${SITE}${nom}`, omitBackground: transparent });
  console.log(`site/${nom} (${taille} px)`);
}
await navigateur.close();
