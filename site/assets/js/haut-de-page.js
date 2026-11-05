/**
 * Bouton « Remonter en haut » : il apparaît après un écran de défilement (1,2 fois la hauteur de
 * la fenêtre), ramène en haut de la page et place le focus sur le titre principal (#titre-page).
 */
const bouton = document.getElementById('haut-de-page');
const titre = document.getElementById('titre-page');
const sansAnimation = globalThis.matchMedia('(prefers-reduced-motion: reduce)');

bouton.hidden = false;

function surveillerDefilement() {
  const visible = globalThis.scrollY >= globalThis.innerHeight * 1.2;
  bouton.classList.toggle('est-visible', visible);
  // Caché, il sort aussi de l'ordre de tabulation et de l'arbre d'accessibilité.
  bouton.toggleAttribute('inert', !visible);
}

bouton.addEventListener('click', () => {
  globalThis.scrollTo({ top: 0, behavior: sansAnimation.matches ? 'auto' : 'smooth' });
  titre.focus({ preventScroll: true });
});

globalThis.addEventListener('scroll', surveillerDefilement, { passive: true });
globalThis.addEventListener('resize', surveillerDefilement, { passive: true });
surveillerDefilement();
