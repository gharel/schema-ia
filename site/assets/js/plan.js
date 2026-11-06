/**
 * Plan de « L’IA en schémas » : SEULE source de vérité des parties, des chapitres, des planches et
 * des parcours. Utilisée par projection.js (numérotation globale « n / TOTAL », navigation entre les
 * pages, parcours), par la recherche du sommaire (mots-clés) et par les tests. Le HTML du sommaire
 * reste écrit à la main : il doit suivre ce plan (un test le vérifie).
 *
 * Une planche : { id: '1.2', titre, parcours, motsCles }. L'id HTML de la section est « p-1-2 ».
 * parcours : 'initiation', 'intermediaire' ou null (planche hors parcours, vue en « Tout projeter »).
 */

/** Deux parcours courts, sans recouvrement : les bases, puis de quoi aller plus loin. */
export const PARCOURS = {
  initiation: { titre: 'Initiation', description: 'Les bases, pour débuter' },
  intermediaire: { titre: 'Intermédiaire', description: 'Pour aller plus loin' },
};

export const PARTIES = [
  { numero: 1, titre: 'Comprendre' },
  { numero: 2, titre: 'Repérer les pièges' },
  { numero: 3, titre: 'Agir avec l’IA' },
];

const I = 'initiation';
const M = 'intermediaire';
const p = (id, titre, parcours, motsCles) => ({ id, titre, parcours, motsCles });

export const CHAPITRES = [
  {
    numero: 1,
    partie: 1,
    fichier: '1-tokens.html',
    titre: 'Tokens et prédiction',
    planches: [
      p(
        '1.1',
        'Comment est créé un modèle',
        I,
        'création, entraînement, pré-entraînement, apprentissage, données d’entraînement, ajustement, fine-tuning, consignes, instructions, retours humains, RLHF, LLM, modèle de langage',
      ),
      p(
        '1.2',
        'Prédire le mot suivant',
        I,
        'prédiction, probabilité, mot suivant, statistique, LLM',
      ),
      p(
        '1.3',
        'Même question, autre réponse',
        M,
        'température, aléatoire, hasard, créativité, réponses différentes, tirage',
      ),
      p(
        '1.4',
        'Sujet rare, réponse sûre d’elle',
        null,
        'sujet rare, assurance, confiance, devinette, probabilité faible',
      ),
      p(
        '1.5',
        'Elle ne sait rien après une date',
        I,
        'date de coupure, knowledge cutoff, actualité, récent, recherche web, connaissances',
      ),
      p(
        '1.6',
        'Le token, l’unité de tout',
        I,
        'token, jeton, mot, découpage, tokenisation, longueur, SMS, roman',
      ),
    ],
  },
  {
    numero: 2,
    partie: 1,
    fichier: '2-memoire.html',
    titre: 'Mémoire',
    planches: [
      p(
        '2.1',
        'La fenêtre de contexte',
        I,
        'fenêtre de contexte, contexte, mémoire, capacité, 200 000, million',
      ),
      p(
        '2.2',
        'Elle relit tout, à chaque message',
        I,
        'relecture, historique, conversation, mémoire, sans mémoire',
      ),
      p(
        '2.3',
        'Ce qui remplit la mémoire',
        null,
        'system prompt, prompt système, consignes cachées, instructions personnalisées, mémoire de l’appli, documents, remplissage',
      ),
      p(
        '2.4',
        'Mémoire pleine : elle résume',
        M,
        'compression, résumé, oubli, mémoire pleine, compactage, milieu, perdu au milieu',
      ),
      p(
        '2.5',
        'Plus c’est long, moins c’est précis',
        M,
        'context rot, longueur, précision, dégradation, MRCR, Chroma, réflexion, o3, Gemini, GPT-4.1',
      ),
      p(
        '2.6',
        'Une longue conversation coûte cher',
        M,
        'coût, longue conversation, quadratique, nouvelle conversation, relecture, tokens lus',
      ),
    ],
  },
  {
    numero: 3,
    partie: 1,
    fichier: '3-modele-effort.html',
    titre: 'Le bon cerveau',
    planches: [
      p(
        '3.1',
        'Trois tailles de modèle',
        M,
        'modèle, Haiku, Sonnet, Opus, Fable, Luna, Terra, Sol, Astra, vitesse, qualité, prix',
      ),
      p(
        '3.2',
        'L’effort de réflexion',
        M,
        'effort, réflexion, raisonnement, thinking, tokens de réflexion',
      ),
      p(
        '3.3',
        'Le bon modèle pour la tâche',
        null,
        'choix du modèle, tâche, coût, budget, effort, réglage, Haiku, Sonnet, Opus',
      ),
      p(
        '3.4',
        'Anatomie d’un prompt',
        I,
        'prompt, consigne, contexte, objectif, distracteur, info en trop, prompt engineering',
      ),
    ],
  },
  {
    numero: 4,
    partie: 2,
    fichier: '4-hallucinations.html',
    titre: 'Hallucinations',
    planches: [
      p(
        '4.1',
        'Une invention qui a l’air vraie',
        I,
        'hallucination, invention, erreur, faux, fiabilité',
      ),
      p(
        '4.2',
        'Pourquoi elle préfère deviner',
        M,
        'SimpleQA, je ne sais pas, classement, benchmark, deviner, hallucination',
      ),
      p(
        '4.3',
        'Les leviers contre l’invention',
        M,
        'leviers, réduire le risque, document, recherche web, sources, RAG, hallucination',
      ),
      p(
        '4.4',
        'Les documents presque justes',
        null,
        'bruit, distracteurs, documents, RAG, Llama, Gemini, presque juste, au hasard',
      ),
      p(
        '4.5',
        'Quoi vérifier',
        I,
        'vérification, fact-checking, dates, chiffres, noms, citations, lois, liens',
      ),
    ],
  },
  {
    numero: 5,
    partie: 2,
    fichier: '5-complaisance.html',
    titre: 'Biais et complaisance',
    planches: [
      p(
        '5.1',
        'Elle reproduit nos stéréotypes',
        I,
        'biais, stéréotypes, sexisme, discrimination, infirmière, chef, données d’entraînement',
      ),
      p(
        '5.2',
        'Jugé sur sa façon d’écrire',
        I,
        'dialecte, anglais afro-américain, racisme caché, racisme, discrimination, métier, condamnation, justice, CV, recrutement, Nature, Hofmann, biais',
      ),
      p(
        '5.3',
        'Homme ou femme, pas le même conseil',
        M,
        'biais, genre, femmes, santé, médecin, patientes, MIT',
      ),
      p(
        '5.4',
        'D’où vient le « oui »',
        I,
        'complaisance, sycophancy, flatterie, oui, votes, retours humains',
      ),
      p(
        '5.5',
        'La question oriente la réponse',
        null,
        'question orientée, avis, insistance, insister, neutralité, complaisance, Australie, eVisitor, visa',
      ),
      p(
        '5.6',
        'Le biais d’automatisation',
        M,
        'biais d’automatisation, confiance, vérification, vigilance',
      ),
      p(
        '5.7',
        'Déléguer sans désapprendre',
        null,
        'déchargement cognitif, esprit critique, compétences, dépendance, apprentissage',
      ),
    ],
  },
  {
    numero: 6,
    partie: 2,
    fichier: '6-message-piege.html',
    titre: 'Sécurité',
    planches: [
      p(
        '6.1',
        'Le trajet de l’ordre caché',
        M,
        'injection de prompt, pirate, e-mail, exfiltration, attaque',
      ),
      p(
        '6.2',
        'Ce que voit l’humain, ce que lit l’IA',
        null,
        'injection de prompt, prompt injection, texte caché, blanc sur blanc',
      ),
      p(
        '6.3',
        'Le trio dangereux',
        M,
        'trio dangereux, lethal trifecta, sécurité, permissions, Simon Willison',
      ),
      p(
        '6.4',
        'Où vont vos données',
        I,
        'données personnelles, confidentialité, RGPD, stockage, entraînement',
      ),
    ],
  },
  {
    numero: 7,
    partie: 3,
    fichier: '7-boite-outils.html',
    titre: 'Boîte à outils',
    planches: [
      p('7.1', 'Le Projet', null, 'projet, contexte, documents, instructions, plan de travail'),
      p('7.2', 'La Skill', null, 'skill, compétence, méthode, recette, procédure, SKILL.md'),
      p(
        '7.3',
        'Le Connecteur',
        null,
        'connecteur, MCP, apps, plugins, Gmail, Drive, agenda, accès, intégration',
      ),
      p(
        '7.4',
        'Projet, Skill ou Connecteur ?',
        M,
        'choisir, projet, skill, connecteur, comparaison, lequel',
      ),
      p(
        '7.5',
        'Mêmes outils, autres noms',
        null,
        'claude, chatgpt, gemini, correspondance, noms, projets, compétences, connecteurs, apps, plugins, GPT personnalisé, GPTs, Gems, assistant sur mesure, migration',
      ),
    ],
  },
  {
    numero: 8,
    partie: 3,
    fichier: '8-agent.html',
    titre: 'Agent sur mesure',
    planches: [
      p(
        '8.1',
        'Répondre ou agir',
        I,
        'chat, agent, Cowork, Work, agent de code, Codex, Claude Code',
      ),
      p(
        '8.2',
        'Qu’est-ce qu’un agent ?',
        M,
        'agent, définition, IA qui agit, but, consignes, outils, autonomie, assistant, devis',
      ),
      p('8.3', 'La boucle de l’agent', M, 'agent, boucle, autonomie, étapes, vérifier'),
      p(
        '8.4',
        'Plus d’accès, plus de risque',
        M,
        'risque, accès, permissions, autorisation, lecture seule',
      ),
      p(
        '8.5',
        'Les 5 briques d’un agent',
        M,
        'créer un agent, consignes, outils, limites, test, AGENTS.md',
      ),
      p(
        '8.6',
        'Toujours lu ou lu au besoin',
        M,
        'AGENTS.md, SKILL.md, CLAUDE.md, mémoire, organisation, fichiers',
      ),
    ],
  },
  {
    numero: 9,
    partie: 3,
    fichier: '9-forfait-api.html',
    titre: 'Forfait ou compteur',
    planches: [
      p('9.1', 'Forfait ou compteur', I, 'forfait, abonnement, API, quota, prix, cache, tokens'),
      p(
        '9.2',
        'Le point de bascule',
        M,
        'point de bascule, coût mensuel, rentabilité, API, forfait',
      ),
      p(
        '9.3',
        'Deux limites : 5 heures et semaine',
        I,
        'limite, quota, fenêtre de 5 heures, 5 h, limite hebdomadaire, semaine, pause, blocage, abonnement, forfait, rate limit',
      ),
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
