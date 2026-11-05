/**
 * npm run miniatures : recopie dans l'éventail du sommaire (site/index.html, `.miniature`) le SVG
 * actuel des planches qu'il montre, pour que les miniatures suivent toujours les vraies planches.
 * Le SVG est copié sans `title`/`desc` ni `role`/`aria-labelledby` (la miniature est aria-hidden).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { PLANCHES } from '../site/assets/js/plan.js';

const SITE = fileURLToPath(new URL('../site/', import.meta.url));
let index = readFileSync(`${SITE}index.html`, 'utf8');

const miniature =
  /(<div\s+class="planche miniature[\s\S]*?<span class="planche__puce">([\d.]+)<\/span>[\s\S]*?<div class="planche__scene">\s*)(<svg[\s\S]*?<\/svg>)/g;

index = index.replace(miniature, (tout, debut, id) => {
  const planche = PLANCHES.find((p) => p.id === id);
  if (!planche) throw new Error(`Miniature ${id} : planche absente du plan`);
  const page = readFileSync(`${SITE}${planche.fichier}`, 'utf8');
  const section = page.match(new RegExp(`<section[^>]*id="${planche.ancre}"[\\s\\S]*?</section>`));
  if (!section) throw new Error(`Planche ${id} introuvable dans ${planche.fichier}`);
  const svg = section[0].match(/<svg[\s\S]*?<\/svg>/)[0];
  const copie = svg
    .replace(/<svg[^>]*>/, '<svg viewBox="0 0 1600 900" focusable="false">')
    .replace(/\s*<title[\s\S]*?<\/title>/, '')
    .replace(/\s*<desc[\s\S]*?<\/desc>/, '')
    // Ids des motifs : préfixés pour rester uniques dans le sommaire.
    .replace(/id="([^"]+)"/g, 'id="mini-$1"')
    .replace(/url\(#([^)]+)\)/g, 'url(#mini-$1)')
    .replace(/href="#([^"]+)"/g, 'href="#mini-$1"');
  return debut + copie;
});

writeFileSync(`${SITE}index.html`, index);
console.log('Miniatures du sommaire recopiées depuis les planches.');
