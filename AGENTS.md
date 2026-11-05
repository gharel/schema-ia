# AGENTS.md : L’IA en schémas · Skazy Formation

Mini-site statique projeté en formation. Une notion = une planche = un grand schéma SVG (16:9, viewBox 1600×900), presque sans texte : titre ≤ 6 mots, quelques étiquettes, gros chiffres, une ligne de source. Pas de quiz, pas de paragraphe. Tout en français (identifiants, commentaires, textes, commits Conventional Commits). Seul `site/` est publié.

## Structure

```
site/index.html                 Sommaire (héros + éventail de miniatures, recherche, 3 parties, cartes-chapitres), écrit à la main
site/1-tokens.html              Chapitre 1 = page DE RÉFÉRENCE à copier pour les chapitres 2 à 9
site/assets/js/plan.js          SEULE source de vérité : parties, chapitres, planches (id, titre, parcours, motsCles), fichiers, PARCOURS
site/assets/js/projection.js    Mode projection (étapes, clavier, parcours, navigation entre pages)
site/assets/js/recherche.js         Recherche du sommaire (titre, mots-clés, chapitre, numéro ; sans dépendance)
site/assets/js/theme.js         Thème clair/sombre/système, clé partagée skazy-outils:theme
site/assets/css/charte.css      Jetons design-skazy + thème sombre + jetons de graphique : seul fichier où une couleur est écrite
site/assets/css/planches.css    Mise en page, vocabulaire SVG (classes), mode projection
site/assets/img/icones.svg      Sprite Lucide (npm run sprite), logos, roue des outils
outils/                         serveur.js, sprite.js, icones-png.js, captures.js
tests/site.spec.js              Playwright (+ aides.js)
```

## Charte

- Georama seule police (locale). Icônes Lucide uniquement (sprite `icones.svg`, `<use href="assets/img/icones.svg#i-nom">`). Aucun emoji. Boutons en pilule, cartes de 16 px + `--shadow-md` + barre de 6 px, pas de dégradé CSS en fond, chemins relatifs.
- Aucun hex hors `charte.css` (exceptions imposées : `<meta theme-color>`, `theme.js`, favicon). Contraste AA : la couleur de série n’est jamais un texte, prendre `--serie-N-texte`.
- Parties : 1 Comprendre = série 1 (dev, bleu) ; 2 Repérer les pièges = série 2 (ia, orange) ; 3 Agir = série 3 (bureautique, violet). `data-partie="N"` sur la section pose `--partie`, `--partie-texte`, `--partie-fond`.
- Typographie : `&nbsp;` avant `? ! ; :` et `·` (aussi dans les SVG), `<span class="insecable">` pour les noms composés. Un test le vérifie.
- Ce qui est distingué par la couleur l’est aussi par une forme, un motif, une étiquette ou une position.

## Une planche

```html
<section
  class="planche"
  id="p-1-2"
  data-partie="1"
  data-parcours="initiation"
  aria-labelledby="t-1-2"
>
  <header class="planche__tete">
    <span class="planche__puce">1.2</span>
    <h2 id="t-1-2" class="planche__titre">…</h2>
  </header>
  <div class="planche__scene">
    <svg viewBox="0 0 1600 900" role="img" aria-labelledby="ti-1-2 de-1-2">
      <title id="ti-1-2">…</title>
      <desc id="de-1-2">…</desc>
      …
    </svg>
  </div>
  <p class="planche__source">Source : …</p>
</section>
```

- `data-parcours="initiation|intermediaire"` selon `plan.js` (aucun attribut pour une planche hors parcours). Ids uniques dans la page (`ti-`, `de-`).
- Étapes : `<g data-etape="1|2|3…">` regroupe ce qui apparaît à chaque clic en projection (tout est visible en défilement). Pas d’attribut `transform` sur l’élément qui porte `data-etape` : la projection y applique `opacity` et `transform` en CSS (mettre les rotations sur des éléments internes).
- Texte SVG : classes de taille `t-xxl` 140, `t-xl` 96, `t-l` 60, `t-m` 44, `t-ms` 40, `t-s` 36, `t-xs` 30 (jamais sous 28) ; couleurs `c-fort`, `c-legende`, `c-sur`, `c-alerte`, `c-p`, `c-1` à `c-7`. Aucun attribut de couleur en dur.
- Formes : `aplat-*` (fond plein + liseré), `encre-*` (fond foncé, texte `c-sur`), `fond-*` (fond clair, texte `c-*`), `trait-*` (contour), suffixes `p` (partie) ou `1` à `7` (séries). Neutres : `neutre`, `piste`, `surface-2`, `trait-legende`, `contour`, `tirets`. Alerte : `aplat-alerte`, `badge-alerte`, `trait-alerte`. Icônes : `<use class="ico-p" href="…icones.svg#i-nom" x y width height>` (`ico-sur`, `ico-legende`, `ico-alerte`, `ico-1…7`).
- Chiffres : reprendre ceux de `simulateur-ia` ; aucun chiffre inventé ; illustratif ⇒ le dire dans la source.

## Parcours et recherche

- Deux parcours sans recouvrement, définis dans `plan.js` (`PARCOURS`, champ `parcours` de chaque planche) : **Initiation** (les bases) et **Intermédiaire** (aller plus loin). Les autres planches ne sont dans aucun parcours (vues avec « Tout projeter »).
- `?parcours=initiation` ou `?parcours=intermediaire` (avec `?projection`) limite la navigation aux planches du parcours, dans la page et d’une page à l’autre ; `?express` reste un alias d’initiation. Le pied affiche « Initiation · 3 / 14 » (« 1.2 · 2 / 43 » hors parcours). Totaux toujours calculés depuis `plan.js`.
- Sommaire : boutons « Tout projeter », « Initiation · n », « Intermédiaire · n » ; marqueurs distincts par forme + lettre + couleur (pastille pleine « I », carré à contour « M ») avec légende.
- Recherche (`recherche.js`) : champ sous le héros, raccourci « / », insensible à la casse et aux accents, tolère une lettre manquante, titre avant mots-clés avant titre de chapitre, 8 résultats, ↓ ↑ Entrée Échap. Chaque résultat : lien vers la planche et lien « Projeter ». Le bloc est masqué sans JavaScript.
- Héros : éventail de trois vraies planches en miniature (copies des SVG de 1.3, 6.3 et 9.2, `.miniature`, `aria-hidden`). Si l’un de ces schémas change, lancer `npm run miniatures` (recopie le SVG dans `index.html`). `projection.js` ignore les miniatures.

## Ajouter une planche ou un chapitre

1. Planche : l’ajouter dans `plan.js` (au bon rang) avec **titre + parcours + mots-clés** (`p(id, titre, parcours, motsCles)`), écrire la section dans la page du chapitre (avec `data-parcours`), et dans `index.html` la ligne de la carte-chapitre (+ marqueur `.marque--initiation` ou `.marque--intermediaire`, + « n planches »). Le test « sommaire suit le plan » échoue sinon. Les mots-clés alimentent la recherche : synonymes, noms propres, sigles que dirait un stagiaire.
2. Chapitre : copier `1-tokens.html` (bandeau, en-tête de chapitre, pied, liens précédent/suivant), changer titre d’onglet « Titre · L’IA en schémas · Skazy Formation », `data-partie`, numéro. Le fichier doit porter le nom prévu dans `plan.js`. Les tests la prennent en compte dès que le fichier existe (`tests/aides.js`).
3. Nouvelle icône : l’ajouter à `outils/sprite.js`, `npm run sprite`.

## Tests et vérifications

`npm run check` (Prettier + html-validate) avant chaque commit ; `npm test` avant chaque push (axe clair/sombre, débordement à 1280/390/360, contraste du texte SVG, projection, parcours, recherche, thème). `npm run captures` puis regarder les PNG de `captures/` (clair, sombre, mobile, projection 1920×1080) : rien ne déborde ni ne se chevauche.

## Publication

Push sur `main` : `.github/workflows/publier.yml` lance `npm ci`, `check`, `test`, puis publie `site/` sur GitHub Pages. `<meta robots noindex>` partout.
