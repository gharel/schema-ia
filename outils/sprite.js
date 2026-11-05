/**
 * npm run sprite : construit site/assets/img/icones.svg (un <symbol id="i-<nom>"> par icône) à partir
 * des icônes Lucide de lucide-static (ISC). Ajouter une icône = l'ajouter à la liste, relancer.
 * Usage dans une page : <svg class="icone" aria-hidden="true"><use href="assets/img/icones.svg#i-sun" /></svg>
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const ICONES = [
  // Interface
  'sun',
  'moon',
  'contrast',
  'house',
  'arrow-up',
  'arrow-left',
  'arrow-right',
  'chevron-left',
  'chevron-right',
  'presentation',
  'play',
  'zap',
  'maximize',
  'minimize',
  'x',
  // Planches
  'file-text',
  'files',
  'book-open',
  'message-square',
  'message-circle',
  'user',
  'users',
  'thumbs-up',
  'dices',
  'globe',
  'calendar',
  'search',
  'triangle-alert',
  'check',
  'brain',
  'cpu',
  'sliders-horizontal',
  'mail',
  'smartphone',
  'code',
  'library',
  'bot',
  'lock',
  'eye',
  'wrench',
  'star',
  // Chapitres 2 à 9
  'stethoscope',
  'fish',
  'user-round',
  'users-round',
  'image',
  'shield-alert',
  'shield-check',
  'key-round',
  'database',
  'cloud',
  'folder-open',
  'plug',
  'chef-hat',
  'clipboard-list',
  'list-checks',
  'eye-off',
  'lightbulb',
  'gauge',
  'timer',
  'coins',
  'wallet',
  'receipt',
  'trending-up',
  'messages-square',
  'repeat',
  'scale',
  'thumbs-down',
  'hand',
  'mouse-pointer-click',
  'layers',
  'archive',
  'briefcase-business',
  'gavel',
  'link',
  'quote',
  'target',
  'puzzle',
  'scroll-text',
  'notebook-pen',
  'file-warning',
  'hospital',
  'house-plus',
  'user-check',
  'badge-check',
  'refresh-cw',
  'hourglass',
  'sparkles',
  'circle-check',
  'circle-help',
  'server',
  'send',
  'paperclip',
  'pencil',
];

const DOSSIER = fileURLToPath(new URL('../node_modules/lucide-static/icons/', import.meta.url));
const SORTIE = fileURLToPath(new URL('../site/assets/img/icones.svg', import.meta.url));

const symboles = ICONES.map((nom) => {
  let source;
  try {
    source = readFileSync(`${DOSSIER}${nom}.svg`, 'utf8');
  } catch {
    throw new Error(`Icône Lucide introuvable dans lucide-static : ${nom}`);
  }
  const interieur = source
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/^[\s\S]*?<svg[^>]*>/, '')
    .replace(/<\/svg>\s*$/, '')
    .trim()
    .split('\n')
    .map((ligne) => `    ${ligne.trim()}`)
    .join('\n');
  return `  <symbol id="i-${nom}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">\n${interieur}\n  </symbol>`;
});

const sprite = `<svg xmlns="http://www.w3.org/2000/svg">
  <!-- Icônes Lucide (lucide-static 0.460.0), licence ISC : https://lucide.dev/license. Généré par npm run sprite. -->
${symboles.join('\n')}
</svg>
`;
writeFileSync(SORTIE, sprite);
console.log(`site/assets/img/icones.svg : ${ICONES.length} icônes`);
