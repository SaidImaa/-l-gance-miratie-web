# Elegance Emiratie — refonte immersive

> *L'Orient, à fleur de peau.*

Une refonte complète de [elegance-emiratie.com](https://www.elegance-emiratie.com), maison française de parfums orientaux (oud, musc, ambre) et d'inspirations de haute parfumerie. Le site raconte **une nuit dans le désert** : on arrive au crépuscule, on traverse la nuit étoilée, on repart à l'aube.

## L'ADN conservé, puis amplifié

| ADN d'origine | Ce qu'il devient |
| --- | --- |
| Parfums orientaux : oud, musc, ambre | **Les trois souffles** : un chapitre plein écran par matière, calligraphie arabe monumentale, flacon qui change de jus |
| Collection Signature | Un **index typographique** : survoler un parfum fait pivoter le flacon 3D, qui révèle sa nouvelle gravure, la couleur de son jus et ses notes en anneau |
| Inspirations de haute parfumerie | Le manifeste : « nous réinterprétons les grandes signatures avec l'âme de l'Orient » |
| Échantillons de 2 ml à 1,90 € | **Le rituel de l'échantillon** : fioles 3D, ajout en un clic, « Essaie avant d'aimer » |
| Packs Signature (1 parfum star + 2 coups de cœur) | **Compose ton trio sacré** : constructeur interactif, arches orientales, prix calculé en direct |
| Article « Oud, musc, ambre : quel parfum oriental est fait pour toi ? » | **Guide olfactif** : un quiz de 3 questions qui recommande un parfum |
| Tutoiement, ton chaleureux | Conservé partout |
| Blog « infos » | **Le Journal** : rail glissant vers les vrais articles |

## Direction artistique

- **Palette** : nuit d'ébène `#070504`, or `#d7b06a → #f7e4b3`, ambre, safran. Chaque parfum a sa couleur de jus et son accent.
- **Calligraphie arabe en 3D** : le nom arabe de chaque souffle et de chaque parfum (عود، مسك، عنبر، ليلة الأبنوس…) s'inscrit en or derrière le flacon et se laisse réfracter par le cristal.
- **Typographies** (auto-hébergées) : *Cormorant Garamond* pour l'éditorial, *Jost* pour l'interface, *Aref Ruqaa* et *Amiri* pour la calligraphie arabe et les chiffres arabes orientaux (١ ٢ ٣).
- **Motif** : l'étoile à huit branches, partout : logo, loader, rosace en lévitation sous le flacon, curseur, puces, motifs de fond.
- **Architecture** : cadres en arche (inspirés des moucharabiehs et des portes orientales) pour les visuels produits.

## Ce qui se passe à l'écran

- **Loader** : l'étoile se dessine trait par trait, puis s'ouvre en masque géant sur la scène.
- **Scène WebGL persistante** (three.js) :
  - flacon octogonal en cristal (transmission, dispersion chromatique, verre facetté), jus coloré, dôme d'or facetté, gravure dorée générée dynamiquement ;
  - typographie monumentale *ELEGANCE / Emiratie* placée **derrière** le flacon, que le cristal réfracte ;
  - dunes procédurales (rides de sable, grains scintillants, contre-jour doré), ciel shader (dégradé, étoiles, croissant de lune, soleil rasant) ;
  - poussière d'or, volutes de fumée d'oud, rosace dorée en lévitation ;
  - post-production : bloom, aberration chromatique, vignettage ;
  - l'heure avance avec le scroll : crépuscule → nuit → aube.
- **Packshots générés en 3D** : chaque flacon et chaque fiole sont « photographiés » dans un studio virtuel au chargement, puis réutilisés dans les packs, les échantillons, le quiz et le panier. Aucune photo n'est nécessaire.
- **Motion design** : défilement doux (Lenis), titres révélés ligne par ligne, mots du manifeste qui s'allument à la lecture, bandeau dont la vitesse suit l'élan du scroll, boutons magnétiques, curseur contextuel, menu plein écran en cercle, signature du footer qui ondule sous la souris.
- **Ambiance sonore** (désactivée par défaut, bouton dans la barre de navigation) : vent du désert, bourdon grave et carillons sur la gamme orientale Hijaz, générés en temps réel avec la Web Audio API.
- **E-commerce** : fiche produit (pyramide olfactive, formats 2 / 15 / 50 / 100 ml), panier persistant (localStorage), Pack Signature, échantillons.

## Lancer le projet

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # version de production dans dist/
npm run preview  # sert dist/
```

`dist/` est un site statique : il se déploie tel quel sur Netlify, Vercel, GitHub Pages ou un CDN (chemins relatifs).

**GitHub Pages en un clic** : activer *Settings → Pages → Source : GitHub Actions*, puis lancer le workflow *Actions → « Déployer sur GitHub Pages » → Run workflow*.

Paramètres d'URL utiles : `?nogl` (force le mode sans WebGL), `?debug` (expose `window.__EE`), `?instant` (désactive l'amorti de la caméra, utile pour les captures).

## Structure

```
index.html            balisage sémantique de toutes les sections
src/main.js           chargement, scroll, chorégraphie, liaison scène ↔ sections
src/data/catalog.js   parfums, notes, souffles, quiz, journal, formats et prix
src/webgl/            world (rendu), bottle (flacon + fiole), sky, dunes,
                      atmosphere (poussière, fumée, rosace, typo 3D), env, studio
src/ui/               director (scroll → caméra), cart, product, sections, fx, toast
src/styles/main.css   direction artistique complète, responsive
```

## À brancher avant la mise en ligne

- **Prix** : seuls « dès 14,90 € » (15 ml) et « 1,90 € » (échantillon 2 ml) proviennent du site actuel. Les prix 50 ml et 100 ml de `src/data/catalog.js` sont des valeurs de maquette.
- **Commande** : le bouton « Passer commande » affiche un message de démo. Il faut le relier au panier Shopify (Storefront API, ou permaliens `/cart/{variant_id}:{qty}`).
- **Newsletter** : le formulaire n'envoie rien pour l'instant ; il faut le connecter à Shopify Customers ou Klaviyo.
- **Catalogue** : 8 créations signature sont mises en scène ; le lien « Voir toutes les créations » renvoie vers la collection complète sur la boutique.

## Accessibilité & performance

- `prefers-reduced-motion` respecté (pas de défilement doux, animations neutralisées).
- Mode de secours sans WebGL (packshots SVG, fond dégradé).
- Qualité 3D adaptée à l'appareil : densité de pixels plafonnée, dunes et particules allégées sur mobile, bloom désactivé sur les petits appareils.
- Rendu 3D suspendu quand l'onglet est caché ou quand la scène est masquée.
