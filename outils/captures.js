/**
 * npm run captures : captures PNG (Playwright) du sommaire et de chaque planche des chapitres qui
 * existent, dans captures/ (ignoré par git) :
 *   <page>-<planche>-clair.png (1280)  -sombre.png (1280)  -mobile.png (390)  -projection.png (1920×1080,
 *   toutes les étapes affichées) ; index-clair.png, index-sombre.png, index-mobile.png.
 * Usage : npm run captures [-- 1-tokens.html] pour une seule page.
 */
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import { CHAPITRES } from '../site/assets/js/plan.js';

const PORT = Number(process.env.PORT_CAPTURES) || 4182;
const SITE = fileURLToPath(new URL('../site/', import.meta.url));
const SORTIE = fileURLToPath(new URL('../captures/', import.meta.url));
mkdirSync(SORTIE, { recursive: true });

const serveur = spawn(process.execPath, [fileURLToPath(new URL('./serveur.js', import.meta.url))], {
  env: { ...process.env, PORT: String(PORT) },
  stdio: 'ignore',
});
await new Promise((resolve) => setTimeout(resolve, 800));

const seule = process.argv[2];
const pages = CHAPITRES.filter(
  (c) => existsSync(`${SITE}${c.fichier}`) && (!seule || c.fichier === seule),
);
const base = `http://localhost:${PORT}/`;
const navigateur = await chromium.launch();

async function ouvrir(contexte, adresse) {
  const page = await contexte.newPage();
  await page.goto(base + adresse);
  await page.evaluate(() => document.fonts.ready);
  // Le bandeau collant et le bouton « Remonter en haut » n'ont rien à faire sur une capture de planche.
  await page.addStyleTag({ content: '.haut-de-page, .bandeau { display: none !important; }' });
  return page;
}

for (const [nom, largeur, hauteur, schema] of [
  ['clair', 1280, 800, 'light'],
  ['sombre', 1280, 800, 'dark'],
  ['mobile', 390, 844, 'light'],
]) {
  const contexte = await navigateur.newContext({
    viewport: { width: largeur, height: hauteur },
    colorScheme: schema,
  });
  if (!seule) {
    const accueil = await ouvrir(contexte, 'index.html');
    await accueil.screenshot({ path: `${SORTIE}index-${nom}.png`, fullPage: true });
  }
  for (const chapitre of pages) {
    const page = await ouvrir(contexte, chapitre.fichier);
    for (const planche of chapitre.planches) {
      const cible = page.locator(`#p-${planche.id.replace('.', '-')}`);
      if (!(await cible.count())) continue;
      await cible.screenshot({
        path: `${SORTIE}${chapitre.fichier.replace('.html', '')}-${planche.id}-${nom}.png`,
      });
    }
  }
  await contexte.close();
}

// Projection : toutes les étapes de chaque planche, plein écran 1920×1080.
const contexte = await navigateur.newContext({ viewport: { width: 1920, height: 1080 } });
for (const chapitre of pages) {
  for (const planche of chapitre.planches) {
    const ancre = `p-${planche.id.replace('.', '-')}`;
    const page = await ouvrir(contexte, `${chapitre.fichier}?projection#${ancre}`);
    if (!(await page.locator(`#${ancre}`).count())) {
      await page.close();
      continue;
    }
    const etapes = await page
      .locator(`#${ancre} [data-etape]`)
      .evaluateAll((els) => Math.max(0, ...els.map((e) => Number(e.dataset.etape))));
    for (let i = 1; i < etapes; i++) await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(600);
    await page.screenshot({
      path: `${SORTIE}${chapitre.fichier.replace('.html', '')}-${planche.id}-projection.png`,
    });
    await page.close();
  }
}
await navigateur.close();
serveur.kill();
console.log(`Captures dans ${SORTIE}`);
