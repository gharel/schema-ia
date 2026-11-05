/**
 * Plan de « L’IA en schémas » : SEULE source de vérité des parties, des chapitres et des planches.
 * Utilisée par projection.js (numérotation globale « n / 39 », navigation entre les pages) et par
 * les tests. Le HTML du sommaire reste écrit à la main : il doit suivre ce plan (un test le vérifie).
 *
 * Une planche : { id: '1.2', titre, express }. L'id HTML de la section est « p-1-2 ».
 */

export const PARTIES = [
  { numero: 1, titre: 'Comprendre' },
  { numero: 2, titre: 'Repérer les pièges' },
  { numero: 3, titre: 'Agir avec l’IA' },
];

const p = (id, titre, express = false) => ({ id, titre, express });

export const CHAPITRES = [
  {
    numero: 1,
    partie: 1,
    fichier: '1-tokens.html',
    titre: 'Tokens et prédiction',
    planches: [
      p('1.1', 'Comment naît un modèle'),
      p('1.2', 'Le token, l’unité de tout', true),
      p('1.3', 'Prédire le mot suivant', true),
      p('1.4', 'Même question, autre réponse'),
      p('1.5', 'Sujet rare, réponse sûre d’elle'),
      p('1.6', 'Elle ne sait rien après une date'),
    ],
  },
  {
    numero: 2,
    partie: 1,
    fichier: '2-memoire.html',
    titre: 'Mémoire',
    planches: [
      p('2.1', 'La fenêtre de contexte', true),
      p('2.2', 'Elle relit tout, à chaque message', true),
      p('2.3', 'Ce qui remplit la mémoire'),
      p('2.4', 'Mémoire pleine : elle résume'),
      p('2.5', 'Plus c’est long, moins c’est précis'),
    ],
  },
  {
    numero: 3,
    partie: 1,
    fichier: '3-modele-effort.html',
    titre: 'Le bon cerveau',
    planches: [
      p('3.1', 'Trois tailles de modèle', true),
      p('3.2', 'L’effort de réflexion'),
      p('3.3', 'Le bon modèle pour la tâche'),
      p('3.4', 'Anatomie d’un prompt', true),
    ],
  },
  {
    numero: 4,
    partie: 2,
    fichier: '4-hallucinations.html',
    titre: 'Hallucinations',
    planches: [
      p('4.1', 'Une invention qui a l’air vraie', true),
      p('4.2', 'Pourquoi elle préfère deviner'),
      p('4.3', 'Les leviers contre l’invention'),
      p('4.4', 'Les documents presque justes'),
      p('4.5', 'Quoi vérifier'),
    ],
  },
  {
    numero: 5,
    partie: 2,
    fichier: '5-complaisance.html',
    titre: 'Biais et complaisance',
    planches: [
      p('5.1', 'Elle reproduit nos stéréotypes', true),
      p('5.2', 'Homme ou femme, pas le même conseil'),
      p('5.3', 'D’où vient le « oui »', true),
      p('5.4', 'La question oriente la réponse'),
      p('5.5', 'Le biais d’automatisation', true),
      p('5.6', 'Déléguer sans désapprendre'),
    ],
  },
  {
    numero: 6,
    partie: 2,
    fichier: '6-message-piege.html',
    titre: 'Sécurité',
    planches: [
      p('6.1', 'Ce que voit l’humain, ce que lit l’IA'),
      p('6.2', 'Le trajet de l’ordre caché', true),
      p('6.3', 'Le trio dangereux', true),
      p('6.4', 'Où vont vos données'),
    ],
  },
  {
    numero: 7,
    partie: 3,
    fichier: '7-boite-outils.html',
    titre: 'Boîte à outils',
    planches: [
      p('7.1', 'Répondre ou agir', true),
      p('7.2', 'La boucle de l’agent', true),
      p('7.3', 'Projet, Skill, Connecteur', true),
      p('7.4', 'Plus d’accès, plus de risque'),
    ],
  },
  {
    numero: 8,
    partie: 3,
    fichier: '8-agent.html',
    titre: 'Agent sur mesure',
    planches: [p('8.1', 'Les 5 briques d’un agent'), p('8.2', 'Toujours lu ou lu au besoin')],
  },
  {
    numero: 9,
    partie: 3,
    fichier: '9-forfait-api.html',
    titre: 'Forfait ou compteur',
    planches: [
      p('9.1', 'Forfait ou compteur', true),
      p('9.2', 'Le point de bascule', true),
      p('9.3', 'Une longue conversation coûte cher'),
    ],
  },
];

/** Liste à plat de toutes les planches, dans l'ordre, avec leur chapitre, leur fichier et leur rang. */
export const PLANCHES = CHAPITRES.flatMap((chapitre) =>
  chapitre.planches.map((planche) => ({
    ...planche,
    chapitre: chapitre.numero,
    partie: chapitre.partie,
    fichier: chapitre.fichier,
    ancre: `p-${planche.id.replace('.', '-')}`,
  })),
).map((planche, index) => ({ ...planche, rang: index + 1 }));

export const TOTAL = PLANCHES.length;

/** Retrouve une planche par son ancre HTML (« p-1-2 »). */
export const parAncre = (ancre) => PLANCHES.find((planche) => planche.ancre === ancre);
