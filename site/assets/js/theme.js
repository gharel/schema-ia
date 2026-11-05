/**
 * Bouton du thème : celui du système, clair, puis sombre. Le choix est gardé dans le navigateur
 * (clé « skazy-outils:theme », partagée par tous les outils Skazy Formation) ; le script en ligne du
 * <head> l'applique avant l'affichage. La page suit un choix fait dans un autre outil ou un autre
 * onglet (événement storage) et au retour depuis le cache du navigateur (pageshow).
 */
const CLE = 'skazy-outils:theme';
const SPRITE = 'assets/img/icones.svg';

const THEMES = {
  auto: { suivant: 'light', icone: 'contrast', nom: 'Thème : celui du système' },
  light: { suivant: 'dark', icone: 'sun', nom: 'Thème : clair' },
  dark: { suivant: 'auto', icone: 'moon', nom: 'Thème : sombre' },
};

// Couleur de la barre du navigateur sur téléphone : celle du bandeau (valeurs imposées par la
// balise meta, qui n'accepte pas de variable CSS).
const BARRE = { light: '#ffffff', dark: '#1f1f1f' };

function lire() {
  try {
    const theme = JSON.parse(localStorage.getItem(CLE));
    return theme === 'light' || theme === 'dark' ? theme : 'auto';
  } catch {
    return 'auto';
  }
}

function ecrire(theme) {
  try {
    if (theme === 'auto') localStorage.removeItem(CLE);
    else localStorage.setItem(CLE, JSON.stringify(theme));
  } catch {
    // stockage indisponible : le choix vaut pour cette visite
  }
}

const bouton = document.getElementById('bouton-theme');
const usage = bouton.querySelector('use');
const barres = document.querySelectorAll('meta[name="theme-color"]');

function appliquer(theme) {
  if (theme === 'auto') delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = theme;
  for (const meta of barres) {
    const schema = meta.media.includes('dark') ? 'dark' : 'light';
    meta.content = BARRE[theme === 'auto' ? schema : theme];
  }
  const t = THEMES[theme];
  usage.setAttribute('href', `${SPRITE}#i-${t.icone}`);
  // Espace insécable avant les deux-points (U+00A0), comme dans tout le texte du site.
  const nom = `${t.nom.replace(' :', ' :')}. Changer de thème`;
  bouton.setAttribute('aria-label', nom);
  bouton.title = nom;
}

let theme = lire();
appliquer(theme);
bouton.hidden = false;
bouton.addEventListener('click', () => {
  theme = THEMES[theme].suivant;
  ecrire(theme);
  appliquer(theme);
});

function resynchroniser() {
  theme = lire();
  appliquer(theme);
}

// Choix changé dans un autre onglet d'un outil (clé null : stockage vidé).
addEventListener('storage', (evenement) => {
  if (evenement.key === CLE || evenement.key === null) resynchroniser();
});

// Retour sur la page depuis le cache du navigateur (bfcache), après un détour par un outil.
addEventListener('pageshow', (evenement) => {
  if (evenement.persisted) resynchroniser();
});
