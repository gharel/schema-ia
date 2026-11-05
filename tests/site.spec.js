import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { CHAPITRES, PLANCHES, TOTAL } from '../site/assets/js/plan.js';
import { PAGES, contraste, ouvrir, verifierBoutonTheme } from './aides.js';

const normaliser = (texte) => texte.replace(/ /g, ' ').replace(/\s+/g, ' ').trim();

for (const { nom, url } of PAGES) {
  test.describe(`${nom} (${url})`, () => {
    test('aucune erreur, aucun emoji, toutes les images se chargent', async ({ page }) => {
      const erreurs = await ouvrir(page, url);
      await page.waitForLoadState('load');
      const texte = (await page.locator('body').innerText()).replace(/[©®™]/g, '');
      expect(texte).not.toMatch(/\p{Extended_Pictographic}/u);
      const cassees = await page.$$eval('img', (images) =>
        images.filter((img) => !img.complete || img.naturalWidth === 0).map((img) => img.src),
      );
      expect(cassees).toEqual([]);
      for (const chemin of ['favicon.svg', 'favicon-32.png', 'apple-touch-icon.png']) {
        expect((await page.request.get(chemin)).ok(), chemin).toBe(true);
      }
      expect(erreurs).toEqual([]);
    });

    test('titre d’onglet et métadonnées', async ({ page }) => {
      await ouvrir(page, url);
      const chapitre = CHAPITRES.find((c) => c.fichier === url);
      const attendu = chapitre
        ? `${chapitre.titre} · L’IA en schémas · Skazy Formation`
        : 'L’IA en schémas · Skazy Formation';
      await expect(page).toHaveTitle(attendu);
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
      await expect(
        page.locator(
          'meta[name="color-scheme"][content="light dark"] + meta[name="darkreader-lock"]',
        ),
      ).toHaveCount(1);
    });

    test('bandeau commun : identité, Les outils, logo Skazy en dernier', async ({ page }) => {
      await ouvrir(page, url);
      const identite = page.locator('a.bandeau__nom');
      await expect(identite).toHaveAttribute('href', 'index.html');
      await expect(identite).toHaveAccessibleName('L’IA en schémas');
      if (url === 'index.html') await expect(identite).toHaveAttribute('aria-current', 'page');
      else {
        await expect(identite).not.toHaveAttribute('aria-current');
        await expect(page.locator('.bandeau a', { hasText: 'Accueil' })).toHaveAttribute(
          'href',
          'index.html',
        );
        await expect(page.getByRole('button', { name: 'Projeter' })).toBeVisible();
      }
      const outils = page.locator('a.bandeau__lien-outils');
      await expect(outils).toHaveAttribute('href', 'https://gharel.github.io/home/');
      await expect(outils).toHaveAttribute('title', 'Tous les outils Skazy Formation');
      await expect(outils).toHaveAttribute('target', '_top');
      await expect(outils).toHaveAccessibleName('Les outils');
      const dernier = page.locator('.bandeau__interieur :is(a, button):visible').last();
      await expect(dernier).toHaveClass(/bandeau__logo/);
      await expect(dernier).toHaveAttribute('href', 'https://formation.skazy.nc');
      await expect(dernier).toHaveAttribute('target', '_blank');
      await expect(dernier).toHaveAttribute('rel', 'noopener');
      await expect(dernier).toHaveAccessibleName('Site de Skazy Formation (nouvel onglet)');
      const [a, b] = await Promise.all([identite.boundingBox(), dernier.boundingBox()]);
      expect(a.x).toBeLessThan(b.x);
    });

    test('typographie : espace insécable avant ? ! ; : et le point médian', async ({ page }) => {
      await ouvrir(page, url);
      const texte = await page.locator('body').innerText();
      expect(texte).not.toMatch(/ [?!;:·]/);
    });

    test('le bouton du thème passe de système à clair, puis sombre, et s’en souvient', async ({
      page,
    }) => {
      await ouvrir(page, url);
      const racine = page.locator('html');
      const bouton = page.locator('#bouton-theme');
      const choix = () => page.evaluate(() => localStorage.getItem('skazy-outils:theme'));
      await expect(racine).not.toHaveAttribute('data-theme');
      await verifierBoutonTheme(page, 'auto');

      await bouton.click();
      await expect(racine).toHaveAttribute('data-theme', 'light');
      await verifierBoutonTheme(page, 'light');
      expect(await choix()).toBe(JSON.stringify('light'));
      await page.reload();
      await expect(racine).toHaveAttribute('data-theme', 'light');
      await verifierBoutonTheme(page, 'light');

      await bouton.click();
      await expect(racine).toHaveAttribute('data-theme', 'dark');
      await verifierBoutonTheme(page, 'dark');
      expect(await choix()).toBe(JSON.stringify('dark'));
      await expect(page.locator('.logo--sombre')).toBeVisible();
      await expect(page.locator('.logo--clair')).toBeHidden();

      await bouton.click();
      await expect(racine).not.toHaveAttribute('data-theme');
      await verifierBoutonTheme(page, 'auto');
      expect(await choix()).toBeNull();
    });

    for (const theme of ['light', 'dark']) {
      for (const largeur of [1280, 390, 360]) {
        test(`mise en page et accessibilité : ${largeur} px, thème ${theme}`, async ({ page }) => {
          await page.emulateMedia({ colorScheme: theme });
          await page.setViewportSize({ width: largeur, height: 800 });
          const erreurs = await ouvrir(page, url);

          const mesure = await page.evaluate(() => ({
            page: document.documentElement.scrollWidth,
            ecran: document.documentElement.clientWidth,
          }));
          expect(mesure.page).toBeLessThanOrEqual(mesure.ecran);
          const dehors = await page.evaluate(() =>
            [...document.querySelectorAll('body *')]
              .filter((el) => el.getClientRects().length && !el.closest('svg, .invisible'))
              .filter((el) => {
                const r = el.getBoundingClientRect();
                return (
                  r.width > 0 && (r.left < -1 || r.right > document.documentElement.clientWidth + 1)
                );
              })
              .map((el) => el.className || el.tagName),
          );
          expect(dehors).toEqual([]);

          // Aucun texte coupé dans son badge, son lien ou sa ligne.
          const coupes = await page.evaluate(() =>
            [
              ...document.querySelectorAll(
                '.badge, .bouton, .bandeau__nom, .bandeau__lien, .carte-chap__titre, .carte-chap__numero, .heros h1, .planche__titre, .planche__puce',
              ),
            ]
              .filter((el) => el.scrollWidth > el.clientWidth + 1)
              .map((el) => el.textContent.trim()),
          );
          expect(coupes).toEqual([]);

          await expect(
            page.locator(theme === 'dark' ? '.logo--sombre' : '.logo--clair'),
          ).toBeVisible();
          const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
          expect(
            axe.violations.map((v) => `${v.id} : ${v.nodes.map((n) => n.target).join(', ')}`),
          ).toEqual([]);
          expect(erreurs).toEqual([]);
        });
      }
    }

    test('le bouton « Remonter en haut » apparaît après défilement et ramène en haut @mobile', async ({
      page,
    }) => {
      await ouvrir(page, url);
      // Le bouton n'apparaît qu'au-delà de 1,2 écran de défilement : une page plus courte n'en a pas besoin.
      const defilement = await page.evaluate(
        () => document.documentElement.scrollHeight - innerHeight > 1.2 * innerHeight,
      );
      test.skip(!defilement, 'page trop courte pour le bouton');
      const bouton = page.getByRole('button', { name: 'Remonter en haut de la page' });
      await expect(bouton).toBeHidden();
      await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
      await expect(bouton).toBeVisible();
      await bouton.click();
      await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
      await expect(page.locator('#titre-page')).toBeFocused();
      await expect(bouton).toBeHidden();
    });

    test('pas de débordement ni de violation axe sur téléphone @mobile', async ({ page }) => {
      await ouvrir(page, url);
      const mesure = await page.evaluate(() => [
        document.documentElement.scrollWidth,
        document.documentElement.clientWidth,
      ]);
      expect(mesure[0]).toBeLessThanOrEqual(mesure[1]);
      const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
      expect(axe.violations.map((v) => v.id)).toEqual([]);
    });
  });
}

test('le sommaire suit le plan (plan.js) : chapitres, planches, express, totaux', async ({
  page,
}) => {
  await ouvrir(page, 'index.html');
  expect(TOTAL).toBe(39);
  expect(PLANCHES.filter((p) => p.express)).toHaveLength(17);
  expect(normaliser(await page.locator('.heros__chiffres').innerText())).toBe(
    `${TOTAL} planches · 9 chapitres · 3 parties`,
  );
  const cartes = page.locator('.carte-chap');
  await expect(cartes).toHaveCount(CHAPITRES.length);
  for (const [i, chapitre] of CHAPITRES.entries()) {
    const carte = cartes.nth(i);
    await expect(carte.locator('.carte-chap__lien')).toHaveAttribute('href', chapitre.fichier);
    expect(normaliser(await carte.locator('.carte-chap__lien').innerText())).toBe(
      normaliser(chapitre.titre),
    );
    await expect(carte.locator('.carte-chap__nombre')).toHaveText(
      `${chapitre.planches.length} planches`,
    );
    await expect(carte.locator('.carte-chap__liste li')).toHaveCount(chapitre.planches.length);
    expect(await carte.locator('.carte-chap__liste li:has(svg)').count()).toBe(
      chapitre.planches.filter((p) => p.express).length,
    );
    await expect(carte.locator('xpath=ancestor::section')).toHaveAttribute(
      'data-partie',
      String(chapitre.partie),
    );
  }
  await expect(page.getByRole('link', { name: 'Tout projeter' })).toHaveAttribute(
    'href',
    '1-tokens.html?projection',
  );
  await expect(page.getByRole('link', { name: 'Parcours express' })).toHaveAttribute(
    'href',
    '1-tokens.html?projection&express',
  );
});

test('le chapitre 1 contient les planches du plan, dans l’ordre', async ({ page }) => {
  await ouvrir(page, '1-tokens.html');
  const attendues = CHAPITRES[0].planches;
  const sections = page.locator('section.planche');
  await expect(sections).toHaveCount(attendues.length);
  for (const [i, planche] of attendues.entries()) {
    const section = sections.nth(i);
    await expect(section).toHaveAttribute('id', `p-${planche.id.replace('.', '-')}`);
    if (planche.express) await expect(section).toHaveAttribute('data-express', '');
    else await expect(section).not.toHaveAttribute('data-express');
    expect(normaliser(await section.locator('.planche__titre').innerText())).toBe(planche.titre);
    await expect(section.locator('.planche__puce')).toHaveText(planche.id);
    await expect(section.locator('svg[viewBox="0 0 1600 900"] title')).toHaveCount(1);
  }
});

for (const theme of ['light', 'dark']) {
  test(`contraste du texte des schémas (SVG), thème ${theme}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: theme });
    await page.setViewportSize({ width: 1280, height: 800 });
    await ouvrir(page, '1-tokens.html');
    const mesures = await page.evaluate(() => {
      const nombres = (c) => c.match(/[\d.]+/g).map(Number);
      const resultats = [];
      for (const texte of document.querySelectorAll('.planche svg text')) {
        if (!texte.textContent.trim()) continue;
        texte.scrollIntoView({ block: 'center' });
        const r = texte.getBoundingClientRect();
        const pile = document
          .elementsFromPoint(r.left + r.width / 2, r.top + r.height / 2)
          .filter((e) => e instanceof SVGGeometryElement && texte.ownerSVGElement.contains(e));
        // Le premier aplat opaque sous le texte, sinon le fond de la scène.
        const dessous = pile.find((e) => {
          const s = getComputedStyle(e);
          return s.fill !== 'none' && Number(s.fillOpacity) === 1 && nombres(s.fill).length === 3;
        });
        const fond = dessous
          ? getComputedStyle(dessous).fill
          : getComputedStyle(texte.closest('.planche__scene')).backgroundColor;
        const style = getComputedStyle(texte);
        resultats.push({
          texte: texte.textContent.trim(),
          taille: parseFloat(style.fontSize),
          couleur: style.fill,
          fond,
        });
      }
      return resultats;
    });
    expect(mesures.length).toBeGreaterThan(50);
    const tropFaibles = mesures
      .filter((m) => contraste(m.couleur, m.fond) < (m.taille < 40 ? 4.5 : 3))
      .map(
        (m) =>
          `${m.texte} (${m.taille}) ${m.couleur} sur ${m.fond} = ${contraste(m.couleur, m.fond).toFixed(2)}`,
      );
    expect(tropFaibles).toEqual([]);
    // Aucun texte de planche plus petit que 28 unités.
    expect(mesures.filter((m) => m.taille < 28).map((m) => m.texte)).toEqual([]);
  });
}

test.describe('projection', () => {
  const idsVisibles = (page) =>
    page.evaluate(() => [...document.querySelectorAll('.planche:not([hidden])')].map((p) => p.id));
  const etapesVues = (page) => page.locator('.planche:not([hidden]) .etape-vue').count();

  test('?projection : une seule planche, les étapes une à une, puis la suivante', async ({
    page,
  }) => {
    const erreurs = await ouvrir(page, '1-tokens.html?projection#p-1-2');
    await expect(page.locator('body')).toHaveClass(/projection/);
    await expect(page.locator('.bandeau')).toBeHidden();
    await expect(page.locator('.pied')).toBeHidden();
    expect(await idsVisibles(page)).toEqual(['p-1-2']);
    await expect(page.locator('.projection__rang')).toHaveText('1.2 · 2 / 39');
    expect(await etapesVues(page)).toBe(1);

    await page.keyboard.press('ArrowRight');
    expect(await etapesVues(page)).toBe(2);
    await page.keyboard.press('Space');
    expect(await etapesVues(page)).toBe(3);
    expect(await idsVisibles(page)).toEqual(['p-1-2']);

    await page.keyboard.press('PageDown');
    expect(await idsVisibles(page)).toEqual(['p-1-3']);
    expect(await page.evaluate(() => location.hash)).toBe('#p-1-3');
    expect(await etapesVues(page)).toBe(1);

    // Retour : la planche précédente s'affiche avec toutes ses étapes.
    await page.keyboard.press('ArrowLeft');
    expect(await idsVisibles(page)).toEqual(['p-1-2']);
    expect(await etapesVues(page)).toBe(3);

    // La scène tient dans l'écran, en 16:9.
    const scene = await page.locator('.planche:not([hidden]) .planche__scene').boundingBox();
    expect(scene.width / scene.height).toBeCloseTo(16 / 9, 1);
    expect(scene.y + scene.height).toBeLessThanOrEqual(800);

    await page.keyboard.press('Escape');
    await expect(page.locator('body')).not.toHaveClass(/projection/);
    await expect(page.locator('section.planche:visible')).toHaveCount(6);
    expect(await page.evaluate(() => location.search)).toBe('');
    expect(await page.evaluate(() => location.hash)).toBe('#p-1-2');
    expect(erreurs).toEqual([]);
  });

  test('un clic sur la scène avance, Début et Fin sautent, le pied annonce la planche', async ({
    page,
  }) => {
    await ouvrir(page, '1-tokens.html?projection');
    expect(await idsVisibles(page)).toEqual(['p-1-1']);
    await page.locator('.planche:not([hidden]) .planche__scene').click();
    expect(await etapesVues(page)).toBe(2);
    await page.keyboard.press('End');
    expect(await idsVisibles(page)).toEqual(['p-1-6']);
    await page.keyboard.press('Home');
    expect(await idsVisibles(page)).toEqual(['p-1-1']);
    await expect(page.locator('[role="status"]')).toContainText('Planche 1 sur 39');
    // Pas de piège clavier : Tab atteint les commandes du pied.
    await page.keyboard.press('Tab');
    await expect(page.locator('.projection__commandes button').first()).toBeFocused();
    await page.getByRole('button', { name: 'Quitter la projection' }).click();
    await expect(page.locator('body')).not.toHaveClass(/projection/);
  });

  test('le bouton « Projeter » projette la planche visible', async ({ page }) => {
    await ouvrir(page, '1-tokens.html');
    await page.evaluate(() => document.querySelector('#p-1-4').scrollIntoView({ block: 'start' }));
    // dispatchEvent : Playwright ferait défiler la page pour atteindre le bouton collant, ce qu'un
    // lecteur ne fait pas.
    await page.getByRole('button', { name: 'Projeter' }).dispatchEvent('click');
    await expect(page.locator('body')).toHaveClass(/projection/);
    expect(await idsVisibles(page)).toEqual(['p-1-4']);
    expect(await page.evaluate(() => location.hash)).toBe('#p-1-4');
  });

  test('?express ne parcourt que les planches express, et passe à la page suivante', async ({
    page,
  }) => {
    await page.route('**/2-memoire.html*', (route) =>
      route.fulfill({ contentType: 'text/html', body: '<!doctype html><title>suite</title>' }),
    );
    await ouvrir(page, '1-tokens.html?projection&express');
    const vues = new Set(await idsVisibles(page));
    expect([...vues]).toEqual(['p-1-2']);
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('ArrowRight');
      for (const id of await idsVisibles(page)) vues.add(id);
    }
    expect([...vues].sort()).toEqual(['p-1-2', 'p-1-3']);
    await Promise.all([
      page.waitForURL(/2-memoire\.html\?projection&express#p-2-1/),
      page.keyboard.press('ArrowRight'),
    ]);
  });
});
