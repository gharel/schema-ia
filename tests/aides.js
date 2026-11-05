import { existsSync } from 'node:fs';
import { expect } from '@playwright/test';
import { CHAPITRES } from '../site/assets/js/plan.js';

// Le sommaire, puis chaque chapitre du plan dont la page existe déjà dans site/.
// PAGES_TESTEES=2-memoire.html,3-modele-effort.html limite les tests de page à cette liste.
const filtre = process.env.PAGES_TESTEES?.split(',').map((f) => f.trim());
export const PAGES = [
  { nom: 'sommaire', url: 'index.html' },
  ...CHAPITRES.filter((c) => existsSync(new URL(`../site/${c.fichier}`, import.meta.url))).map(
    (c) => ({ nom: `chapitre ${c.numero}`, url: c.fichier }),
  ),
].filter((p) => !filtre || filtre.includes(p.url));

// Bouton du thème, le même dans tous les outils : l'icône montre l'état actuel, que le nom
// (aria-label et title) dit aussi, avec une espace insécable avant les deux-points.
export const ETATS_THEME = {
  auto: { icone: 'contrast', nom: 'celui du système' },
  light: { icone: 'sun', nom: 'clair' },
  dark: { icone: 'moon', nom: 'sombre' },
};

export async function verifierBoutonTheme(page, theme) {
  const bouton = page.locator('#bouton-theme');
  const nom = `Thème : ${ETATS_THEME[theme].nom}. Changer de thème`;
  await expect(bouton).toHaveAttribute('aria-label', nom);
  await expect(bouton).toHaveAttribute('title', nom);
  await expect(bouton.locator('use')).toHaveAttribute(
    'href',
    `assets/img/icones.svg#i-${ETATS_THEME[theme].icone}`,
  );
}

/** Ouvre une page, polices chargées, et renvoie la liste (vivante) des erreurs de la page. */
export async function ouvrir(page, adresse) {
  const erreurs = [];
  page.on('console', (message) => message.type() === 'error' && erreurs.push(message.text()));
  page.on('pageerror', (erreur) => erreurs.push(erreur.message));
  await page.goto(adresse);
  await page.evaluate(() => document.fonts.ready);
  return erreurs;
}

/** Rapport de luminance relative WCAG entre deux couleurs « rgb(r, g, b) ». */
export function contraste(a, b) {
  const luminance = (css) => {
    const [r, g, bleu] = css
      .match(/[\d.]+/g)
      .slice(0, 3)
      .map(Number);
    const lin = (v) => {
      const c = v / 255;
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(bleu);
  };
  const [clair, sombre] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (clair + 0.05) / (sombre + 0.05);
}
