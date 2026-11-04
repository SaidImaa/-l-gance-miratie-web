/**
 * Catalogue — Elegance Emiratie
 * ------------------------------------------------------------------
 * Noms, notes olfactives et liens produits repris des fiches publiques
 * de elegance-emiratie.com.
 *
 * ⚠️  PRIX : seuls « dès 14,90 € » (15 ml) et « 1,90 € » (échantillon 2 ml)
 * sont confirmés. Les prix 50 ml / 100 ml ci-dessous sont des valeurs de
 * maquette à synchroniser avec Shopify avant mise en ligne.
 */

export const SHOP = 'https://www.elegance-emiratie.com';

export const FORMATS = [
  { id: '2ml', label: 'Échantillon', volume: '2 ml', price: 1.9 },
  { id: '15ml', label: 'Voyage', volume: '15 ml', price: 14.9 },
  { id: '50ml', label: 'Signature', volume: '50 ml', price: 34.9 }, // à confirmer
  { id: '100ml', label: 'Grand flacon', volume: '100 ml', price: 49.9 }, // à confirmer
];

export const PACK_DISCOUNT = 0.34; // « jusqu'à -34 % » constaté sur les Packs Signature

export const PERFUMES = [
  {
    id: 'infini-oud',
    name: 'Infini Oud',
    ar: 'عود لا ينتهي',
    concentration: 'Eau de parfum',
    family: 'Oriental aromatique',
    souffle: 'oud',
    tagline: "L'oud, jusqu'à l'horizon.",
    description:
      "Une lavande vive et un safran lumineux ouvrent la voie à un oud profond, posé sur un musc soyeux. Un sillage qui ne s'arrête jamais, comme les dunes à perte de vue.",
    notes: { tete: ['Lavande', 'Safran'], coeur: ['Oud'], fond: ['Musc'] },
    season: 'Toutes saisons',
    liquid: '#4a2468',
    accent: '#b892ff',
    url: `${SHOP}/products/infini-oud-eau-de-parfum`,
  },
  {
    id: 'oud-vanille',
    name: 'Oud & Vanille',
    ar: 'عود وفانيلا',
    concentration: 'Eau de parfum',
    family: 'Oriental épicé',
    souffle: 'ambre',
    tagline: 'Le feu et la caresse.',
    description:
      "Le safran, le poivre et la cardamome embrasent l'ouverture. Puis la vanille enveloppe tout, avant que l'oud et le santal ne signent un fond chaud et magnétique.",
    notes: { tete: ['Safran', 'Poivre', 'Cardamome'], coeur: ['Vanille'], fond: ['Oud', 'Santal'] },
    season: 'Automne · Hiver',
    liquid: '#7a3510',
    accent: '#f3a35a',
    url: `${SHOP}/products/oud-and-vanille-eau-de-parfum`,
  },
  {
    id: 'happiness-oud',
    name: 'Happiness Oud',
    ar: 'عود السعادة',
    concentration: 'Extrait de parfum',
    family: 'Oriental gourmand',
    souffle: 'oud',
    tagline: "La joie, version extrait.",
    description:
      "Une vanille lumineuse rencontre un oud tout en rondeur, sur un fond de cèdre musqué. La concentration d'un extrait, la douceur d'un sourire.",
    notes: { tete: ['Vanille'], coeur: ['Oud'], fond: ['Cèdre', 'Musc'] },
    season: 'Toutes saisons',
    liquid: '#c4841a',
    accent: '#ffd27a',
    url: `${SHOP}/products/happiness-oud-extrait-de-parfum`,
  },
  {
    id: 'nuit-debene',
    name: "Nuit d'Ébène",
    ar: 'ليلة الأبنوس',
    concentration: 'Eau de parfum',
    family: 'Gourmand boisé',
    souffle: 'ambre',
    tagline: 'Le velours de la nuit.',
    description:
      "Vanille et fève tonka se lovent sur un lit d'ambre, portés par le cèdre et le musc. Un gourmand boisé, sombre et addictif, pour les nuits qui ne finissent pas.",
    notes: { tete: ['Vanille', 'Fève tonka'], coeur: ['Ambre'], fond: ['Cèdre', 'Musc'] },
    season: 'Automne · Hiver',
    liquid: '#26140b',
    accent: '#d4a463',
    url: `${SHOP}/products/nuit-debene`,
  },
  {
    id: 'noir',
    name: 'Noir',
    ar: 'أسود',
    concentration: 'Eau de parfum',
    family: 'Boisé fruité',
    souffle: 'oud',
    tagline: "L'audace à l'état pur.",
    description:
      "Une framboise sombre éclaire l'encens et l'oud, avant que l'ambre et le benjoin ne laissent un sillage puissant. Intense, tenace, taillé pour la saison froide.",
    notes: { tete: ['Framboise'], coeur: ['Encens', 'Oud'], fond: ['Ambre', 'Benjoin'] },
    season: 'Automne · Hiver',
    liquid: '#3d0a1c',
    accent: '#ee5a80',
    url: `${SHOP}/products/noir-eau-de-parfum`,
  },
  {
    id: 'maitre',
    name: 'Maître',
    ar: 'السيّد',
    concentration: 'Eau de parfum',
    family: 'Floral boisé',
    souffle: 'musc',
    tagline: 'Les fleurs, sous la garde du bois.',
    description:
      "Jasmin, narcisse, rose et cyclamen dans un écrin de bois d'agar. Le patchouli et l'encens apportent la profondeur : une tenue longue, un sillage maîtrisé.",
    notes: { tete: ['Jasmin', 'Narcisse'], coeur: ['Rose', 'Cyclamen', "Bois d'agar"], fond: ['Patchouli', 'Encens'] },
    season: 'Toutes saisons',
    liquid: '#7a2d40',
    accent: '#f4a6b6',
    url: `${SHOP}/products/maitre-eau-de-parfum`,
  },
  {
    id: 'elegante',
    name: 'Élégante',
    ar: 'أنيقة',
    concentration: 'Eau de parfum',
    family: 'Gourmand oriental',
    souffle: 'ambre',
    tagline: "Le miel, le tabac, l'hiver.",
    description:
      "Lavande et bergamote pour l'éclat, un cœur de miel doré, puis le tabac et la vanille qui s'installent sur la peau. Un oriental gourmand d'une élégance absolue.",
    notes: { tete: ['Lavande', 'Bergamote'], coeur: ['Miel'], fond: ['Tabac', 'Vanille', 'Fève tonka'] },
    season: 'Hiver',
    liquid: '#8f4c17',
    accent: '#ecb86e',
    url: `${SHOP}/products/voux-elegante-eau-de-parfum`,
  },
  {
    id: 'musc-fruite',
    name: 'Musc Fruité',
    ar: 'مسك الفاكهة',
    concentration: 'Eau de parfum',
    family: 'Fruité musqué',
    souffle: 'musc',
    tagline: "L'été, à fleur de peau.",
    description:
      "Orange, bergamote et cédrat pétillent au soleil. Le musc adoucit leur éclat d'une sensualité aérienne, sur un fond de vanille et d'ambre. Frais, solaire, mixte.",
    notes: { tete: ['Orange', 'Bergamote', 'Cédrat'], coeur: ['Musc'], fond: ['Vanille', 'Ambre'] },
    season: 'Printemps · Été',
    liquid: '#e2b84e',
    accent: '#fff0b0',
    url: `${SHOP}/products/musc-fruite`,
  },
];

/** Autres créations de la maison (pour les bandeaux) */
export const MORE_NAMES = [
  'Eternal Oud',
  'Midnight Oud',
  'Musc Kashmiri',
  'Spicy Amber',
  'Or Vanillé',
  'Infini Oud',
  "Nuit d'Ébène",
  'Happiness Oud',
];

export const SIGNATURE = {
  id: 'signature',
  name: 'Signature',
  concentration: 'Eau de parfum',
  liquid: '#d08a34',
  accent: '#ffcf86',
};

export const SOUFFLES = [
  {
    key: 'oud',
    ar: 'عود',
    numeral: '١',
    title: "L'Oud",
    kicker: 'Le bois des rois',
    text:
      "Né du cœur résiné de l'aquilaria, l'oud est l'âme de la parfumerie orientale. Profond, fumé, presque sacré : il ne se porte pas, il se révèle.",
    facets: ['Fumé', 'Boisé', 'Résineux', 'Profond'],
    forYou: 'Pour toi si tu veux un sillage qui impose le silence.',
    perfumes: ['infini-oud', 'happiness-oud', 'noir'],
    liquid: '#3a1d0e',
    tint: '#2b1408',
  },
  {
    key: 'musc',
    ar: 'مسك',
    numeral: '٢',
    title: 'Le Musc',
    kicker: 'La seconde peau',
    text:
      "Doux, enveloppant, infiniment sensuel. Le musc se fond dans la peau jusqu'à devenir la tienne : une caresse qui reste longtemps après ton passage.",
    facets: ['Soyeux', 'Poudré', 'Propre', 'Sensuel'],
    forYou: 'Pour toi si tu aimes séduire en murmurant.',
    perfumes: ['musc-fruite', 'maitre'],
    liquid: '#d9b3a6',
    tint: '#3b2622',
  },
  {
    key: 'ambre',
    ar: 'عنبر',
    numeral: '٣',
    title: "L'Ambre",
    kicker: 'Le soleil liquide',
    text:
      "Chaleureux, résineux, solaire. L'ambre illumine la peau comme le soleil couchant embrase les dunes, et laisse derrière lui une traînée d'or.",
    facets: ['Chaud', 'Vanillé', 'Résineux', 'Lumineux'],
    forYou: 'Pour toi si tu veux un parfum qui enlace.',
    perfumes: ['nuit-debene', 'elegante', 'oud-vanille'],
    liquid: '#c0601a',
    tint: '#3a1a06',
  },
];

export const JOURNAL = [
  {
    tag: 'Guide',
    title: 'Oud, musc, ambre : quel parfum oriental est fait pour toi ?',
    url: `${SHOP}/blogs/infos/oud-musc-ambre-quel-parfum-oriental-est-fait-pour-toi`,
    glyph: 'ع',
    hue: ['#5a2a0f', '#c88a3c'],
  },
  {
    tag: 'Culture',
    title: 'Les senteurs du Moyen-Orient : ce qui rend les parfums orientaux si uniques',
    url: `${SHOP}/blogs/infos/decouverte-des-senteurs-du-moyen-orient-ce-qui-rend-les-parfums-orientaux-si-uniques`,
    glyph: 'ش',
    hue: ['#1d1430', '#8a5fbf'],
  },
  {
    tag: 'Packs',
    title: '5 Packs Signature pour composer ton parfum unique',
    url: `${SHOP}/blogs/infos/5-packs-signature-pour-composer-ton-parfum-unique`,
    glyph: 'م',
    hue: ['#3a0d1a', '#d65b7c'],
  },
  {
    tag: 'Homme',
    title: 'Parfum homme : entre intensité, élégance et audace',
    url: `${SHOP}/blogs/infos/parfum-homme-elegance-emiratie-la-signature-olfactive-qui-revele-votre-personnalite`,
    glyph: 'ر',
    hue: ['#0e1414', '#5f8a7c'],
  },
  {
    tag: 'Sélection',
    title: 'Notre sélection des meilleurs parfums orientaux',
    url: `${SHOP}/blogs/infos/notre-selection-des-meilleurs-parfums-orientaux-sur-elegance-emiratie`,
    glyph: 'ن',
    hue: ['#3b2306', '#e6b34f'],
  },
];

export const QUIZ = [
  {
    q: 'Quel moment te ressemble ?',
    options: [
      { label: 'Le soleil de midi', ar: 'ظهر', score: { 'musc-fruite': 3, 'happiness-oud': 1, maitre: 1 } },
      { label: 'Le coucher de soleil', ar: 'غروب', score: { elegante: 2, 'oud-vanille': 2, 'happiness-oud': 2, maitre: 1 } },
      { label: 'La nuit profonde', ar: 'ليل', score: { 'nuit-debene': 2, noir: 3, 'infini-oud': 2 } },
    ],
  },
  {
    q: "Qu'est-ce qui t'attire en premier ?",
    options: [
      { label: "L'éclat des agrumes", ar: 'حمضيات', score: { 'musc-fruite': 3, 'infini-oud': 1 } },
      { label: 'La douceur de la vanille', ar: 'فانيلا', score: { 'nuit-debene': 2, 'oud-vanille': 2, 'happiness-oud': 2, elegante: 1 } },
      { label: 'Le mystère du bois fumé', ar: 'دخان', score: { 'infini-oud': 2, noir: 2, 'oud-vanille': 1 } },
      { label: 'Le velours des fleurs', ar: 'زهور', score: { maitre: 3, 'musc-fruite': 1 } },
    ],
  },
  {
    q: 'Ton sillage idéal ?',
    options: [
      { label: 'Une caresse, tout en douceur', ar: 'همس', score: { 'musc-fruite': 2, 'happiness-oud': 1, maitre: 1 } },
      { label: "Présent, qu'on remarque", ar: 'حضور', score: { elegante: 2, 'oud-vanille': 1, 'infini-oud': 1 } },
      { label: "Inoubliable, qu'on retient", ar: 'أثر', score: { noir: 2, 'nuit-debene': 2, 'infini-oud': 1 } },
    ],
  },
];

export const byId = (id) => PERFUMES.find((p) => p.id === id);

export const euro = (n) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);
