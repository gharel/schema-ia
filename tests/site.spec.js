import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { CHAPITRES, PARCOURS, PLANCHES, TOTAL } from '../site/assets/js/plan.js';
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
      const titre = chapitre?.titre ?? (url === 'glossaire.html' ? 'Glossaire' : null);
      const attendu = titre
        ? `${titre} · L’IA en schémas · Skazy Formation`
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
        // Projeter : seulement sur les pages de planches (pas sur le glossaire).
        if (CHAPITRES.some((c) => c.fichier === url)) {
          await expect(page.getByRole('button', { name: 'Projeter' })).toBeVisible();
        }
      }
      const glossaire = page.locator('.bandeau a[href="glossaire.html"]');
      await expect(glossaire).toHaveAccessibleName('Glossaire');
      if (url === 'glossaire.html') await expect(glossaire).toHaveAttribute('aria-current', 'page');
      else await expect(glossaire).not.toHaveAttribute('aria-current');
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

const planchesDe = (k) => PLANCHES.filter((p) => p.parcours === k);
const premiere = (k) => planchesDe(k)[0];

test('le sommaire suit le plan (plan.js) : chapitres, planches, parcours, totaux', async ({
  page,
}) => {
  await ouvrir(page, 'index.html');
  expect(planchesDe('initiation').length + planchesDe('intermediaire').length).toBeLessThan(TOTAL);
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
    const lignes = carte.locator('.carte-chap__liste li');
    await expect(lignes).toHaveCount(chapitre.planches.length);
    for (const [j, planche] of chapitre.planches.entries()) {
      const ligne = lignes.nth(j);
      expect(normaliser(await ligne.innerText())).toContain(normaliser(planche.titre));
      await expect(ligne.locator('.rang')).toHaveText(planche.id);
      await expect(ligne.locator('.marque')).toHaveCount(planche.parcours ? 1 : 0);
      if (planche.parcours) {
        await expect(ligne.locator('.marque')).toHaveClass(
          new RegExp(`marque--${planche.parcours}`),
        );
        await expect(ligne.locator('.marque')).toHaveAttribute(
          'aria-label',
          `Parcours ${PARCOURS[planche.parcours].titre}`,
        );
      }
    }
    await expect(carte.locator('xpath=ancestor::section')).toHaveAttribute(
      'data-partie',
      String(chapitre.partie),
    );
  }
  await expect(page.getByRole('link', { name: 'Tout projeter' })).toHaveAttribute(
    'href',
    '1-tokens.html?projection',
  );
  for (const [k, { titre }] of Object.entries(PARCOURS)) {
    const bouton = page.locator(`.heros__boutons a[href*="parcours=${k}"]`);
    await expect(bouton).toHaveAttribute('href', `${premiere(k).fichier}?projection&parcours=${k}`);
    expect(normaliser(await bouton.innerText())).toBe(`${titre} · ${planchesDe(k).length}`);
    await expect(bouton).toHaveAttribute('title', /.+/);
  }
  await expect(page.locator('a[href*="express"]')).toHaveCount(0);
  // Légende des deux marqueurs.
  await expect(page.locator('.sommaire__legende .marque')).toHaveCount(2);
});

test('le chapitre 1 contient les planches du plan, dans l’ordre', async ({ page }) => {
  await ouvrir(page, '1-tokens.html');
  const attendues = CHAPITRES[0].planches;
  const sections = page.locator('section.planche');
  await expect(sections).toHaveCount(attendues.length);
  for (const [i, planche] of attendues.entries()) {
    const section = sections.nth(i);
    await expect(section).toHaveAttribute('id', `p-${planche.id.replace('.', '-')}`);
    if (planche.parcours) await expect(section).toHaveAttribute('data-parcours', planche.parcours);
    else await expect(section).not.toHaveAttribute('data-parcours');
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

test('glossaire : mots dans l’ordre, chaque lien mène à une planche du plan, avec son titre', async ({
  page,
}) => {
  await ouvrir(page, 'glossaire.html');
  const mots = await page.$$eval('.terme__mot', (dts) => dts.map((d) => d.textContent.trim()));
  expect(mots.length).toBeGreaterThan(30);
  const tries = [...mots].sort((a, b) => a.localeCompare(b, 'fr', { sensitivity: 'base' }));
  expect(mots).toEqual(tries);
  const liens = await page.$$eval('.terme__planches a', (as) =>
    as.map((a) => ({ href: a.getAttribute('href'), texte: a.textContent })),
  );
  for (const { href, texte } of liens) {
    const [fichier, ancre] = href.split('#');
    const planche = PLANCHES.find((p) => p.ancre === ancre);
    expect(planche, href).toBeTruthy();
    expect(planche.fichier, href).toBe(fichier);
    expect(normaliser(texte), href).toBe(normaliser(`${planche.id}${planche.titre}`));
  }
  // Chaque lettre du sommaire de lettres mène à un groupe.
  for (const href of await page.$$eval('.glossaire__lettres a', (as) =>
    as.map((a) => a.getAttribute('href')),
  )) {
    await expect(page.locator(href)).toHaveCount(1);
  }
});

test.describe('projection', () => {
  const idsVisibles = (page) =>
    page.evaluate(() => [...document.querySelectorAll('.planche:not([hidden])')].map((p) => p.id));
  const etapesVues = (page) => page.locator('.planche:not([hidden]) .etape-vue').count();
  const titreSeul = (page) =>
    page
      .locator('.planche:not([hidden])')
      .evaluate((p) => p.classList.contains('planche--titre-seul'));

  test('?projection : le titre seul, puis les étapes une à une, puis la suivante', async ({
    page,
  }) => {
    const erreurs = await ouvrir(page, '1-tokens.html?projection#p-1-2');
    await expect(page.locator('body')).toHaveClass(/projection/);
    await expect(page.locator('.bandeau')).toBeHidden();
    await expect(page.locator('.pied')).toBeHidden();
    expect(await idsVisibles(page)).toEqual(['p-1-2']);
    await expect(page.locator('.projection__rang')).toHaveText(`1.2 · 2 / ${TOTAL}`);
    // En arrivant : le titre seul, la scène et la source masquées (le formateur pose la question).
    expect(await titreSeul(page)).toBe(true);
    expect(await etapesVues(page)).toBe(0);
    await expect(page.locator('#t-1-2')).toBeVisible();
    await expect(page.locator('#p-1-2 .planche__scene')).toHaveCSS('opacity', '0');
    await expect(page.locator('#p-1-2 .planche__source')).toHaveCSS('opacity', '0');

    await page.keyboard.press('ArrowRight');
    expect(await titreSeul(page)).toBe(false);
    expect(await etapesVues(page)).toBe(1);
    await expect(page.locator('#p-1-2 .planche__scene')).toHaveCSS('opacity', '1');
    await page.keyboard.press('ArrowRight');
    expect(await etapesVues(page)).toBe(2);
    await page.keyboard.press('Space');
    expect(await etapesVues(page)).toBe(3);
    expect(await idsVisibles(page)).toEqual(['p-1-2']);

    await page.keyboard.press('PageDown');
    expect(await idsVisibles(page)).toEqual(['p-1-3']);
    expect(await page.evaluate(() => location.hash)).toBe('#p-1-3');
    expect(await titreSeul(page)).toBe(true);
    expect(await etapesVues(page)).toBe(0);

    // Retour : la planche précédente s'affiche avec toutes ses étapes.
    await page.keyboard.press('ArrowLeft');
    expect(await idsVisibles(page)).toEqual(['p-1-2']);
    expect(await titreSeul(page)).toBe(false);
    expect(await etapesVues(page)).toBe(3);
    // Puis, en reculant, jusqu'au titre seul avant de quitter la planche.
    for (let k = 2; k >= 1; k--) {
      await page.keyboard.press('ArrowLeft');
      expect(await etapesVues(page)).toBe(k);
    }
    await page.keyboard.press('ArrowLeft');
    expect(await idsVisibles(page)).toEqual(['p-1-2']);
    expect(await titreSeul(page)).toBe(true);
    await page.keyboard.press('PageUp');
    expect(await idsVisibles(page)).toEqual(['p-1-1']);
    await page.keyboard.press('PageDown');
    expect(await idsVisibles(page)).toEqual(['p-1-2']);
    expect(await titreSeul(page)).toBe(true);

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

  test('data-depart="0" : le titre, la situation de départ seule, puis une étape par clic', async ({
    page,
  }) => {
    const erreurs = await ouvrir(page, '4-hallucinations.html?projection#p-4-3');
    expect(await idsVisibles(page)).toEqual(['p-4-3']);
    expect(await titreSeul(page)).toBe(true);
    await page.keyboard.press('ArrowRight');
    expect(await titreSeul(page)).toBe(false);
    expect(await etapesVues(page)).toBe(0);
    for (let k = 1; k <= 5; k++) {
      await page.keyboard.press('ArrowRight');
      expect(await etapesVues(page)).toBe(k);
    }
    // En revenant en arrière, on retrouve la jauge pleine, puis le titre seul.
    for (let k = 4; k >= 0; k--) {
      await page.keyboard.press('ArrowLeft');
      expect(await etapesVues(page)).toBe(k);
    }
    expect(await titreSeul(page)).toBe(false);
    await page.keyboard.press('ArrowLeft');
    expect(await titreSeul(page)).toBe(true);
    expect(await idsVisibles(page)).toEqual(['p-4-3']);
    expect(erreurs).toEqual([]);
  });

  test('un clic sur la scène avance, Début et Fin sautent, le pied annonce la planche', async ({
    page,
  }) => {
    await ouvrir(page, '1-tokens.html?projection');
    expect(await idsVisibles(page)).toEqual(['p-1-1']);
    // La scène masquée (titre seul) reste cliquable.
    await page.locator('.planche:not([hidden]) .planche__scene').click();
    expect(await etapesVues(page)).toBe(1);
    await page.locator('.planche:not([hidden]) .planche__scene').click();
    expect(await etapesVues(page)).toBe(2);
    await page.keyboard.press('End');
    expect(await idsVisibles(page)).toEqual(['p-1-6']);
    await page.keyboard.press('Home');
    expect(await idsVisibles(page)).toEqual(['p-1-1']);
    await expect(page.locator('[role="status"]')).toContainText(`Planche 1 sur ${TOTAL}`);
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

  for (const [k, { titre }] of Object.entries(PARCOURS)) {
    test(`?parcours=${k} ne parcourt que les ${planchesDe(k).length} planches du parcours`, async ({
      page,
    }) => {
      const dePage = planchesDe(k).filter((p) => p.fichier === '1-tokens.html');
      const suivante = planchesDe(k).find((p) => p.fichier !== '1-tokens.html');
      await page.route(`**/${suivante.fichier}*`, (route) =>
        route.fulfill({ contentType: 'text/html', body: '<!doctype html><title>suite</title>' }),
      );
      await ouvrir(page, `${premiere(k).fichier}?projection&parcours=${k}`);
      const vues = new Set(await idsVisibles(page));
      await expect(page.locator('.projection__rang')).toHaveText(
        `${titre} · 1 / ${planchesDe(k).length}`,
      );
      for (let i = 0; i < 40; i++) {
        if (!page.url().includes('1-tokens')) break;
        await page.keyboard.press('ArrowRight');
        for (const id of await idsVisibles(page).catch(() => [])) vues.add(id);
      }
      expect([...vues].sort()).toEqual(dePage.map((p) => p.ancre).sort());
      await page.waitForURL(
        new RegExp(
          `${suivante.fichier.replace('.', '\\.')}\\?projection&parcours=${k}#${suivante.ancre}`,
        ),
      );
    });
  }

  test('le pied annonce « Initiation · n / total » en parcours, et ?express est un alias', async ({
    page,
  }) => {
    const initiation = planchesDe('initiation');
    const p = initiation[2];
    await ouvrir(page, `${p.fichier}?projection&parcours=initiation#${p.ancre}`);
    await expect(page.locator('.projection__rang')).toHaveText(
      `Initiation · 3 / ${initiation.length}`,
    );
    await expect(page.locator('[role="status"]')).toContainText('Parcours Initiation');
    await ouvrir(page, `${p.fichier}?projection&express#${p.ancre}`);
    await expect(page.locator('.projection__rang')).toHaveText(
      `Initiation · 3 / ${initiation.length}`,
    );
    expect(await idsVisibles(page)).toEqual([p.ancre]);
  });
});

test.describe('recherche du sommaire', () => {
  const champ = (page) => page.locator('#champ-recherche');
  const resultats = (page) => page.locator('#resultats-recherche .resultat__rang');
  const rangs = async (page) => (await resultats(page).allInnerTexts()).map((t) => t.trim());

  test('visible, étiquetée, avec le raccourci « / »', async ({ page }) => {
    await ouvrir(page, 'index.html');
    await expect(champ(page)).toBeVisible();
    await expect(champ(page)).toHaveAccessibleName(/Rechercher une planche/);
    await expect(champ(page)).toHaveAttribute('placeholder', 'biais, token, connecteur…');
    await expect(page.locator('.recherche__raccourci')).toHaveText('/');
    await page.keyboard.press('/');
    await expect(champ(page)).toBeFocused();
    expect(await champ(page).inputValue()).toBe('');
    // Dans le champ, « / » s'écrit normalement.
    await page.keyboard.type('a/b');
    expect(await champ(page).inputValue()).toBe('a/b');
  });

  test('« biais » trouve 5.1, 5.2 et 5.6 en tête, avec les deux liens', async ({ page }) => {
    await ouvrir(page, 'index.html');
    await champ(page).fill('biais');
    const trouves = await rangs(page);
    expect(trouves.length).toBeLessThanOrEqual(8);
    expect(trouves.slice(0, 3).sort()).toEqual(['5.1', '5.2', '5.6']);
    await expect(page.locator('#etat-recherche')).toHaveText(/planches trouvées/);
    const premier = page.locator('#resultats-recherche .resultat').first();
    const planche = PLANCHES.find((p) => p.id === trouves[0]);
    await expect(premier.locator('.resultat__lien')).toHaveAttribute(
      'href',
      `${planche.fichier}#${planche.ancre}`,
    );
    await expect(premier.locator('.resultat__projeter')).toHaveAttribute(
      'href',
      `${planche.fichier}?projection#${planche.ancre}`,
    );
    await expect(premier.locator('.resultat__chapitre')).toContainText('Biais et complaisance');
  });

  test('« connecteur » trouve 7.3 en premier', async ({ page }) => {
    await ouvrir(page, 'index.html');
    await champ(page).fill('connecteur');
    expect((await rangs(page))[0]).toBe('7.3');
    expect(await rangs(page)).toContain('7.4');
  });

  test('insensible à la casse, aux accents et à une lettre manquante', async ({ page }) => {
    await ouvrir(page, 'index.html');
    for (const saisie of ['Token', 'TOKEN', 'tokn']) {
      await champ(page).fill(saisie);
      expect(await rangs(page), saisie).toContain('1.6');
    }
    await champ(page).fill('Mémoire');
    const avecAccent = await rangs(page);
    await champ(page).fill('memoire');
    expect(await rangs(page)).toEqual(avecAccent);
    await champ(page).fill('5.2');
    expect((await rangs(page))[0]).toBe('5.2');
  });

  test('Entrée ouvre la bonne page, ↓ ↑ parcourent, Échap vide, message sans résultat', async ({
    page,
  }) => {
    await ouvrir(page, 'index.html');
    await champ(page).fill('biais');
    await page.keyboard.press('ArrowDown');
    await expect(page.locator('#resultats-recherche .resultat__lien').first()).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await expect(page.locator('#resultats-recherche .resultat__lien').nth(1)).toBeFocused();
    await page.keyboard.press('ArrowUp');
    await page.keyboard.press('ArrowUp');
    await expect(champ(page)).toBeFocused();
    await page.keyboard.press('Escape');
    expect(await champ(page).inputValue()).toBe('');
    await expect(page.locator('#resultats-recherche')).toBeHidden();

    await champ(page).fill('zzzzqx');
    await expect(page.locator('#resultats-recherche')).toContainText('Aucune planche');
    await expect(page.locator('#etat-recherche')).toHaveText('Aucun résultat');

    await champ(page).fill('connecteur');
    await Promise.all([
      page.waitForURL(/7-boite-outils\.html#p-7-3$/),
      page.keyboard.press('Enter'),
    ]);
  });
});
