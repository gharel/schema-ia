/**
 * Recherche du sommaire : retrouver une planche en quelques secondes.
 *
 * - Champ #champ-recherche (le bloc #recherche est masqué sans JavaScript).
 * - Insensible à la casse et aux accents ; cherche dans le titre, les mots-clés, le titre du chapitre
 *   et le numéro (« 5.2 », ou « 5 » pour un chapitre). Tous les mots saisis doivent correspondre.
 * - Tolère une lettre manquante (« tokn » trouve « token »). Titre avant mots-clés, 8 résultats au plus.
 * - Clavier : « / » va au champ, ↓ ↑ parcourent les résultats, Entrée ouvre le premier (ou le lien
 *   qui a le focus), Échap vide le champ.
 *
 * Module ES sans dépendance ; les données viennent de plan.js.
 */
import { CHAPITRES, PARCOURS, PLANCHES } from './plan.js';

const MAX = 8;

/** Minuscules, sans accents, apostrophes et espaces insécables unifiés. */
export function normaliser(texte) {
  return texte
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[’‘`]/g, "'")
    .replace(/[  ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const mots = (texte) => texte.split(/[^a-z0-9.]+/).filter(Boolean);

/** « tokn » est une suite de lettres de « token », même initiale, mot à peine plus long. */
function approche(mot, cible) {
  if (mot.length < 4 || cible.length > mot.length + 2 || mot[0] !== cible[0]) return false;
  let i = 0;
  for (const lettre of cible) if (lettre === mot[i]) i += 1;
  return i === mot.length;
}

const index = PLANCHES.map((planche) => {
  const chapitre = CHAPITRES.find((c) => c.numero === planche.chapitre);
  const titre = normaliser(planche.titre);
  const cles = normaliser(planche.motsCles ?? '');
  const chap = normaliser(chapitre.titre);
  return {
    planche,
    chapitre,
    titre,
    cles,
    chap,
    motsTitre: mots(titre),
    motsCles: mots(cles),
    motsChap: mots(chap),
  };
});

/** Score d'un mot saisi pour une entrée de l'index ; 0 si rien ne correspond. */
function scoreMot(mot, e) {
  const { id } = e.planche;
  if (/^\d/.test(mot)) {
    if (id === mot) return 300;
    if (mot.includes('.') ? id.startsWith(mot) : id.startsWith(`${mot}.`)) return 120;
  }
  let score = 0;
  if (e.titre.includes(mot)) {
    const debutMot = e.motsTitre.some((m) => m.startsWith(mot));
    // Un titre court qui contient le mot passe devant un titre long.
    score = Math.max(score, (debutMot ? 100 : 70) + (30 * mot.length) / e.titre.length);
  }
  if (e.cles.includes(mot)) {
    score = Math.max(score, e.motsCles.some((m) => m.startsWith(mot)) ? 50 : 35);
  }
  if (e.chap.includes(mot)) score = Math.max(score, 20);
  if (!score && mot.length >= 4) {
    const proche = (liste) => liste.some((m) => approche(mot, m));
    if (proche(e.motsTitre)) score = 12;
    else if (proche(e.motsCles)) score = 8;
  }
  return score;
}

/** Planches qui correspondent à la saisie, les plus pertinentes d'abord (toutes, sans limite). */
export function chercher(saisie) {
  const requete = mots(normaliser(saisie));
  if (!requete.length) return [];
  const trouvees = [];
  for (const e of index) {
    let total = 0;
    for (const mot of requete) {
      const s = scoreMot(mot, e);
      if (!s) {
        total = 0;
        break;
      }
      total += s;
    }
    if (total) trouvees.push({ e, total });
  }
  trouvees.sort((a, b) => b.total - a.total || a.e.planche.rang - b.e.planche.rang);
  return trouvees.map(({ e }) => e.planche);
}

/** Espaces insécables avant « ? ! ; : » et le point médian, après « et avant » (typographie du site). */
const typo = (texte) => texte.replace(/ ([?!;:·»])/g, ' $1').replace(/« /g, '« ');

function marque(parcours) {
  const span = document.createElement('span');
  span.className = `marque marque--${parcours}`;
  span.setAttribute('role', 'img');
  span.setAttribute('aria-label', `Parcours ${PARCOURS[parcours].titre}`);
  span.title = `Parcours ${PARCOURS[parcours].titre}`;
  span.textContent = parcours === 'initiation' ? 'I' : 'M';
  return span;
}

function creerResultat(planche) {
  const chapitre = CHAPITRES.find((c) => c.numero === planche.chapitre);
  const li = document.createElement('li');
  li.className = 'resultat';
  li.dataset.partie = String(planche.partie);

  const lien = document.createElement('a');
  lien.className = 'resultat__lien';
  lien.href = `${planche.fichier}#${planche.ancre}`;

  const rang = document.createElement('span');
  rang.className = 'resultat__rang';
  rang.textContent = planche.id;
  const texte = document.createElement('span');
  texte.className = 'resultat__texte';
  const titre = document.createElement('span');
  titre.className = 'resultat__titre';
  titre.textContent = typo(planche.titre);
  const chap = document.createElement('span');
  chap.className = 'resultat__chapitre';
  chap.textContent = typo(`Chapitre ${chapitre.numero} · ${chapitre.titre}`);
  texte.append(titre, chap);
  lien.append(rang, texte);
  if (planche.parcours) lien.append(marque(planche.parcours));

  const projeter = document.createElement('a');
  projeter.className = 'resultat__projeter';
  projeter.href = `${planche.fichier}?projection#${planche.ancre}`;
  projeter.textContent = 'Projeter';
  projeter.setAttribute('aria-label', `Projeter la planche ${planche.id}, ${planche.titre}`);

  li.append(lien, projeter);
  return li;
}

function demarrer() {
  const bloc = document.getElementById('recherche');
  const champ = document.getElementById('champ-recherche');
  const liste = document.getElementById('resultats-recherche');
  const etat = document.getElementById('etat-recherche');
  if (!bloc || !champ || !liste || !etat) return;
  bloc.hidden = false;

  const liens = () => [...liste.querySelectorAll('.resultat__lien')];

  function afficher() {
    const saisie = champ.value;
    liste.replaceChildren();
    if (!normaliser(saisie)) {
      liste.hidden = true;
      etat.textContent = '';
      return;
    }
    const trouvees = chercher(saisie);
    liste.hidden = false;
    if (!trouvees.length) {
      const vide = document.createElement('li');
      vide.className = 'resultat resultat--vide';
      vide.textContent = typo(
        'Aucune planche ne correspond. Essayez un mot plus court, ou un numéro comme 5.2.',
      );
      liste.append(vide);
      etat.textContent = 'Aucun résultat';
      return;
    }
    for (const planche of trouvees.slice(0, MAX)) liste.append(creerResultat(planche));
    const n = trouvees.length;
    const affichees = Math.min(n, MAX);
    etat.textContent =
      n === 1
        ? '1 planche trouvée'
        : `${n} planches trouvées${n > MAX ? `, les ${affichees} premières affichées` : ''}`;
  }

  champ.addEventListener('input', afficher);

  champ.addEventListener('keydown', (evenement) => {
    if (evenement.key === 'ArrowDown') {
      liens()[0]?.focus();
      evenement.preventDefault();
    } else if (evenement.key === 'Enter') {
      const premier = liens()[0];
      if (premier) location.href = premier.href;
      evenement.preventDefault();
    } else if (evenement.key === 'Escape') {
      champ.value = '';
      afficher();
    }
  });

  liste.addEventListener('keydown', (evenement) => {
    const courant = evenement.target.closest?.('.resultat__lien');
    if (evenement.key === 'Escape') {
      champ.value = '';
      afficher();
      champ.focus();
      evenement.preventDefault();
    } else if (courant && (evenement.key === 'ArrowDown' || evenement.key === 'ArrowUp')) {
      const tous = liens();
      const i = tous.indexOf(courant) + (evenement.key === 'ArrowDown' ? 1 : -1);
      if (i < 0) champ.focus();
      else tous[Math.min(i, tous.length - 1)].focus();
      evenement.preventDefault();
    }
  });

  document.addEventListener('keydown', (evenement) => {
    if (evenement.key !== '/' || evenement.ctrlKey || evenement.altKey || evenement.metaKey) return;
    const cible = evenement.target;
    if (cible instanceof Element && cible.closest('input, textarea, select, [contenteditable]')) {
      return;
    }
    evenement.preventDefault();
    champ.focus();
    champ.select();
  });
}

demarrer();
