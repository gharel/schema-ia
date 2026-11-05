/**
 * Mode projection : une seule planche plein écran, révélée étape par étape.
 *
 * - Activé par ?projection dans l'adresse ou par le bouton « Projeter » du bandeau (qui projette
 *   la planche visible). Le corps de la page reçoit la classe .projection (voir planches.css).
 * - Les éléments [data-etape="k"] d'une planche apparaissent dans l'ordre (classe .etape-vue).
 * - → Espace PageDown clic : étape suivante, puis planche suivante, puis chapitre suivant.
 *   ← PageUp : l'inverse (la planche précédente s'affiche avec toutes ses étapes).
 *   Début / Fin : première / dernière planche de la page. F : plein écran. Échap : quitter.
 * - ?express : seulement les planches marquées data-express, y compris d'une page à l'autre.
 * - Le hash (#p-1-3) positionne la planche ; il est mis à jour pendant la projection.
 * - La numérotation « n / 39 » et la navigation entre les pages viennent de plan.js.
 *
 * Module ES sans dépendance.
 */
import { PLANCHES, TOTAL, parAncre } from './plan.js';

const SPRITE = 'assets/img/icones.svg';
const CLE_ARRIVEE = 'schema-ia:arrivee';

const corps = document.body;
const parametres = new URLSearchParams(location.search);
const express = parametres.has('express');
const fichierCourant = location.pathname.split('/').pop() || 'index.html';
const toutes = [...document.querySelectorAll('.planche')];
const liste = express ? toutes.filter((planche) => planche.hasAttribute('data-express')) : toutes;

let actif = false;
let indice = 0;
let etape = 0;
let pied = null;
let annonce = null;
const maxEtapes = new WeakMap();

function etapesDe(planche) {
  if (!maxEtapes.has(planche)) {
    const numeros = [...planche.querySelectorAll('[data-etape]')].map((e) =>
      Number(e.dataset.etape),
    );
    maxEtapes.set(planche, numeros.length ? Math.max(...numeros) : 0);
  }
  return maxEtapes.get(planche);
}

const premiereEtape = (planche) => Math.min(1, etapesDe(planche));

function recherche(avecProjection) {
  const morceaux = [];
  if (avecProjection) morceaux.push('projection');
  if (express) morceaux.push('express');
  return morceaux.length ? `?${morceaux.join('&')}` : '';
}

function majAdresse(planche) {
  history.replaceState(null, '', `${location.pathname}${recherche(actif)}#${planche.id}`);
}

function stockerArrivee(valeur) {
  try {
    if (valeur) sessionStorage.setItem(CLE_ARRIVEE, valeur);
    else sessionStorage.removeItem(CLE_ARRIVEE);
  } catch {
    // stockage indisponible : on arrive au début de la planche
  }
}

function lireArrivee() {
  try {
    return sessionStorage.getItem(CLE_ARRIVEE);
  } catch {
    return null;
  }
}

function icone(nom) {
  return `<svg class="icone" aria-hidden="true"><use href="${SPRITE}#i-${nom}" /></svg>`;
}

function bouton(nom, libelle, action) {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'bouton-icone';
  b.setAttribute('aria-label', libelle);
  b.title = libelle;
  b.innerHTML = icone(nom);
  b.addEventListener('click', action);
  return b;
}

function construirePied() {
  pied = document.createElement('div');
  pied.className = 'projection__pied';
  pied.setAttribute('role', 'group');
  pied.setAttribute('aria-label', 'Commandes de projection');

  const rang = document.createElement('span');
  rang.className = 'projection__rang';
  const aide = document.createElement('span');
  aide.className = 'projection__aide';
  aide.textContent = '→ ou Espace : suivant · ← : précédent · F : plein écran · Échap : quitter';
  const commandes = document.createElement('div');
  commandes.className = 'projection__commandes';
  commandes.append(
    bouton('chevron-left', 'Étape précédente', precedent),
    bouton('chevron-right', 'Étape suivante', suivant),
    bouton('maximize', 'Plein écran', basculerPleinEcran),
    bouton('x', 'Quitter la projection', sortir),
  );
  pied.append(rang, aide, commandes);

  annonce = document.createElement('p');
  annonce.className = 'invisible';
  annonce.setAttribute('role', 'status');
  annonce.setAttribute('aria-live', 'polite');
  corps.append(pied, annonce);
}

function afficherEtapes(planche, k) {
  for (const element of planche.querySelectorAll('[data-etape]')) {
    element.classList.toggle('etape-vue', Number(element.dataset.etape) <= k);
  }
}

function montrer(i, k, { annoncer = true } = {}) {
  indice = i;
  const planche = liste[i];
  etape = k;
  for (const p of toutes) p.hidden = p !== planche;
  afficherEtapes(planche, etape);
  majAdresse(planche);
  const infos = parAncre(planche.id);
  const rang = infos ? `${infos.id} · ${infos.rang} / ${TOTAL}` : planche.id;
  pied.querySelector('.projection__rang').textContent = rang;
  if (annoncer) {
    annonce.textContent = infos
      ? `Planche ${infos.rang} sur ${TOTAL} : ${infos.titre}`
      : `Planche ${i + 1}`;
  }
}

/** Planche voisine, dans le plan complet, qui se trouve sur une autre page (sens : 1 ou -1). */
function pageVoisine(sens) {
  const courante = parAncre(liste[indice].id);
  if (!courante) return null;
  const candidates = PLANCHES.filter((p) => !express || p.express);
  const position = candidates.findIndex((p) => p.rang === courante.rang);
  const suite = sens > 0 ? candidates.slice(position + 1) : candidates.slice(0, position).reverse();
  return suite.find((p) => p.fichier !== fichierCourant) ?? null;
}

function allerPage(sens) {
  const voisine = pageVoisine(sens);
  if (!voisine) return;
  stockerArrivee(sens < 0 ? 'fin' : null);
  location.href = `${voisine.fichier}${recherche(true)}#${voisine.ancre}`;
}

function suivant() {
  const planche = liste[indice];
  if (etape < etapesDe(planche)) montrer(indice, etape + 1, { annoncer: false });
  else if (indice < liste.length - 1) montrer(indice + 1, premiereEtape(liste[indice + 1]));
  else allerPage(1);
}

function precedent() {
  if (etape > premiereEtape(liste[indice])) montrer(indice, etape - 1, { annoncer: false });
  else if (indice > 0) montrer(indice - 1, etapesDe(liste[indice - 1]));
  else allerPage(-1);
}

function debut() {
  montrer(0, premiereEtape(liste[0]));
}

function fin() {
  montrer(liste.length - 1, etapesDe(liste[liste.length - 1]));
}

function basculerPleinEcran() {
  try {
    if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
    else document.documentElement.requestFullscreen?.().catch(() => {});
  } catch {
    // repli silencieux : la projection fonctionne aussi en fenêtre
  }
}

/** Planche la plus proche du milieu de la fenêtre (point de départ du bouton « Projeter »). */
function planceVisible() {
  const milieu = innerHeight / 2;
  let meilleure = 0;
  let distance = Infinity;
  liste.forEach((planche, i) => {
    const r = planche.getBoundingClientRect();
    const ecart = milieu < r.top ? r.top - milieu : Math.max(0, milieu - r.bottom);
    if (ecart < distance) {
      distance = ecart;
      meilleure = i;
    }
  });
  return meilleure;
}

function entrer(i, k) {
  if (!liste.length) return;
  actif = true;
  corps.classList.add('projection');
  if (!pied) construirePied();
  scrollTo(0, 0);
  montrer(i, k ?? premiereEtape(liste[i]));
}

function sortir() {
  if (!actif) return;
  const planche = liste[indice];
  actif = false;
  corps.classList.remove('projection');
  for (const p of toutes) p.hidden = false;
  pied?.remove();
  annonce?.remove();
  pied = null;
  annonce = null;
  if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
  history.replaceState(null, '', `${location.pathname}#${planche.id}`);
  planche.scrollIntoView({ block: 'start' });
  document.getElementById('bouton-projeter')?.focus({ preventScroll: true });
}

function depuisAdresse() {
  const ancre = location.hash.slice(1);
  let i = liste.findIndex((p) => p.id === ancre);
  if (i < 0) {
    // Planche absente de la liste (parcours express) : la première express qui suit, sinon la première.
    const position = toutes.findIndex((p) => p.id === ancre);
    i = position < 0 ? 0 : liste.findIndex((p) => toutes.indexOf(p) > position);
    if (i < 0) i = 0;
  }
  return i;
}

function surClavier(evenement) {
  if (!actif || evenement.ctrlKey || evenement.altKey || evenement.metaKey) return;
  const surCommande = evenement.target instanceof Element && evenement.target.closest('a, button');
  switch (evenement.key) {
    case 'ArrowRight':
    case 'PageDown':
      suivant();
      break;
    case ' ':
    case 'Spacebar':
      // Sur un bouton, la barre d'espace garde son rôle natif (pas de piège clavier).
      if (surCommande) return;
      suivant();
      break;
    case 'ArrowLeft':
    case 'PageUp':
      precedent();
      break;
    case 'Home':
      debut();
      break;
    case 'End':
      fin();
      break;
    case 'f':
    case 'F':
      basculerPleinEcran();
      break;
    case 'Escape':
      sortir();
      break;
    default:
      return;
  }
  evenement.preventDefault();
}

function demarrer() {
  if (!toutes.length) return;
  document.addEventListener('keydown', surClavier);
  for (const scene of document.querySelectorAll('.planche__scene')) {
    scene.addEventListener('click', (evenement) => {
      if (actif && !evenement.target.closest?.('a, button')) suivant();
    });
  }
  document.getElementById('bouton-projeter')?.addEventListener('click', () => {
    const i = planceVisible();
    entrer(i);
  });
  addEventListener('hashchange', () => {
    if (!actif) return;
    const i = liste.findIndex((p) => p.id === location.hash.slice(1));
    if (i >= 0 && i !== indice) montrer(i, premiereEtape(liste[i]));
  });

  if (parametres.has('projection')) {
    if (!liste.length) {
      // Parcours express sans planche express sur cette page : on passe à la suivante.
      corps.classList.add('projection');
      const premiere = PLANCHES.find((p) => p.express && p.fichier !== fichierCourant);
      const ici = PLANCHES.find((p) => p.fichier === fichierCourant);
      const suite = PLANCHES.find((p) => p.express && ici && p.rang > ici.rang);
      const cible = suite ?? premiere;
      if (cible) location.replace(`${cible.fichier}${recherche(true)}#${cible.ancre}`);
      return;
    }
    const i = depuisAdresse();
    const arrivee = lireArrivee();
    stockerArrivee(null);
    entrer(i, arrivee === 'fin' ? etapesDe(liste[i]) : undefined);
  } else {
    stockerArrivee(null);
  }
}

demarrer();
