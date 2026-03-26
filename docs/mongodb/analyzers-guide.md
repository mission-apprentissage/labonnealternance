# Guide des Analyzers MongoDB Atlas Search

> Ce guide explique comment fonctionnent les analyzers disponibles dans MongoDB Atlas Search (v8.2), avec des exemples concrets, leurs avantages et leurs limites. Il s'adresse aussi bien aux profils techniques que non-techniques.

---

## Qu'est-ce qu'un analyzer ?

Quand vous tapez une recherche, MongoDB ne compare pas directement votre texte aux données stockées. Il passe d'abord par un **analyzer** : un mécanisme qui transforme le texte (à l'indexation et à la recherche) en une série de **termes** comparables.

Concrètement, un analyzer fait trois choses dans l'ordre :

1. **Découpe** le texte en petits morceaux appelés *tokens* (mots, syllabes, etc.)
2. **Normalise** ces tokens (majuscules → minuscules, suppression des accents...)
3. **Filtre** les tokens inutiles (mots très courants, mots vides...)

Le choix de l'analyzer impacte directement **ce que la recherche peut trouver et ce qu'elle manque**.

---

## Comparatif rapide

| Analyzer | Découpe sur | Minuscules | Mots vides | Stemming | Usage principal |
|---|---|---|---|---|---|
| **Standard** | Espaces + ponctuation | Oui | Oui (anglais) | Non | Recherche générale (anglais) |
| **Simple** | Tout ce qui n'est pas une lettre | Oui | Non | Non | Noms, titres simples |
| **Whitespace** | Espaces uniquement | Non | Non | Non | Tags, codes, identifiants |
| **Keyword** | Rien (1 seul token) | Non | Non | Non | Correspondance exacte |
| **Language** | Espaces + ponctuation | Oui | Oui (par langue) | Oui | Recherche en langue naturelle |
| **Custom** | Configurable | Configurable | Configurable | Configurable | Besoins spécifiques sur mesure |

---

## Standard — `lucene.standard`

### Ce que c'est

L'analyzer **par défaut** de MongoDB Atlas Search. Il est conçu pour la recherche en anglais et convient à la plupart des cas d'usage généraux.

### Comment il transforme le texte

Il applique trois étapes dans l'ordre :

1. **Découpe** aux espaces et à la ponctuation (virgules, points, tirets, slashes…)
2. **Met tout en minuscules**
3. **Supprime les mots vides anglais** (`a`, `the`, `is`, `of`, `in`, `to`, `and`, `or`, `not`…)

**Exemple :**

| Étape | Résultat |
|---|---|
| Texte original | `"The quick brown FOX jumps over the lazy dog."` |
| Après découpe | `The` / `quick` / `brown` / `FOX` / `jumps` / `over` / `the` / `lazy` / `dog` |
| Après minuscules | `the` / `quick` / `brown` / `fox` / `jumps` / `over` / `the` / `lazy` / `dog` |
| Tokens finaux (mots vides retirés) | `quick` / `brown` / `fox` / `jumps` / `over` / `lazy` / `dog` |

Rechercher `"FOX"` ou `"fox"` trouvera ce document. Rechercher `"The"` ne le trouvera pas (mot vide retiré).

**Cas concret — annonce d'alternance :**

| Texte indexé | Tokens générés |
|---|---|
| `"Contrat en alternance pour un développeur"` | `contrat` / `alternance` / `pour` / `développeur` |

> Note : `"en"` et `"un"` sont des mots vides anglais… mais pas français. Le Standard Analyzer est calibré pour l'anglais, donc les mots vides français ne sont pas supprimés.

### Avantages
- Comportement intelligent par défaut : gère bien les emails (`foo@bar.com` reste un seul token), les URLs, etc.
- Insensible à la casse : `"Alternance"` et `"alternance"` sont équivalents
- Bon compromis entre précision et rappel pour l'anglais

### Limitations
- **Pas de stemming** : `"cherche"` et `"chercher"` sont deux tokens différents — une recherche sur `"cherche"` ne trouvera pas `"chercher"`
- **Mots vides en anglais seulement** : pour du contenu français, certains mots comme `"le"`, `"la"`, `"de"` ne sont pas supprimés
- **Attention aux phrases courtes** : une phrase composée uniquement de mots vides anglais donnera zéro token après analyse

### Idéal pour
Recherche textuelle générale sur du contenu en anglais ou multilingue sans besoins linguistiques avancés.

---

## Simple — `lucene.simple`

### Ce que c'est

Un analyzer minimaliste qui divise le texte partout où il ne trouve **pas une lettre** : chiffres, ponctuation, espaces — tout est un délimiteur. Il met ensuite tout en minuscules.

### Comment il transforme le texte

1. **Découpe** sur tout caractère non-alphabétique (chiffres inclus)
2. **Met tout en minuscules**
3. Les chiffres sont **supprimés**, pas indexés

**Exemple :**

| Texte original | Tokens générés |
|---|---|
| `"Hello, World!"` | `hello` / `world` |
| `"don't"` | `don` / `t` |
| `"iPhone 15 Pro"` | `iphone` / `pro` *(le "15" disparaît)* |
| `"2024-01-15"` | *(rien — tout est chiffres et tirets)* |
| `"café-latte"` | `café` / `latte` *(les lettres accentuées sont conservées)* |
| `"user@example.com"` | `user` / `example` / `com` |

**Cas concret — noms de métiers :**

| Texte indexé | Tokens générés |
|---|---|
| `"Développeur Web Full-Stack"` | `développeur` / `web` / `full` / `stack` |

### Avantages
- Simple et prévisible : pas de surprise sur ce qui est indexé
- Fonctionne avec toutes les langues (pas de liste de mots vides)
- Bonne tolérance aux fautes de ponctuation ou tirets incohérents

### Limitations
- **Les chiffres disparaissent** : `"iPhone 15"` devient juste `iphone` — impossible de chercher par numéro de version, code postal, etc.
- **Pas de stemming** : les variantes morphologiques ne sont pas reliées
- **Apostrophe = coupure** : `"c'est"` donne `c` et `est` — le token `c` est peu utile

### Idéal pour
Noms, titres, libellés de compétences où les chiffres ne sont pas importants et où on veut une découpe simple et prévisible.

---

## Whitespace — `lucene.whitespace`

### Ce que c'est

L'analyzer le plus brut : il coupe **uniquement aux espaces**, et ne touche à rien d'autre. La casse est préservée, la ponctuation reste attachée aux mots.

### Comment il transforme le texte

1. **Découpe uniquement aux espaces** (tab, espace, saut de ligne)
2. **Aucun autre traitement** : pas de minuscules, pas de suppression de ponctuation

**Exemple :**

| Texte original | Tokens générés |
|---|---|
| `"It's a bird, it's a plane!"` | `It's` / `a` / `bird,` / `it's` / `a` / `plane!` |
| `"JavaScript / TypeScript"` | `JavaScript` / `/` / `TypeScript` |
| `"Paris-Lyon"` | `Paris-Lyon` *(un seul token, pas de coupure sur le tiret)* |

> Attention : `"It's"` et `"it's"` sont deux tokens **différents** car la casse n'est pas normalisée.

**Cas concret — tags de compétences :**

| Tags indexés | Tokens générés |
|---|---|
| `"Node.js TypeScript React"` | `Node.js` / `TypeScript` / `React` |

Ici, `"Node.js"` reste intact — contrairement au Standard Analyzer qui le découperait.

### Avantages
- Préserve exactement les termes techniques avec ponctuation (`Node.js`, `C++`, `C#`)
- Aucune transformation surprenante : ce qui est stocké est ce qui est indexé
- Utile pour des listes de tags séparés par des espaces

### Limitations
- **Sensible à la casse** : `"React"` et `"react"` sont traités comme des termes différents
- **La ponctuation reste attachée** : `"Paris,"` (avec virgule) ne matchera pas `"Paris"` (sans virgule)
- **Aucun filtre linguistique** : tous les mots, même les plus courants (`"a"`, `"le"`, `"the"`), sont indexés
- **Peu adapté à la saisie utilisateur** : les utilisateurs font des variations de casse, d'espacement, de ponctuation

### Idéal pour
Tags normalisés, identifiants techniques, codes séparés par des espaces, cas où vous contrôlez précisément le format des données.

---

## Keyword — `lucene.keyword`

### Ce que c'est

L'analyzer **le plus strict** : il ne découpe rien du tout. Le champ entier est traité comme un seul et unique token, sans modification. C'est l'équivalent d'une comparaison de chaînes de caractères exacte.

### Comment il transforme le texte

1. **Aucune découpe** — la chaîne entière devient un seul token
2. **Aucune normalisation** — casse, ponctuation, espaces : tout est conservé tel quel

**Exemple :**

| Texte original | Token généré |
|---|---|
| `"mongodb"` | `mongodb` |
| `"MongoDB Atlas"` | `MongoDB Atlas` *(espaces inclus, un seul token)* |
| `"hello, world!"` | `hello, world!` *(ponctuation incluse)* |
| `"75008"` | `75008` |

**Cas concret — statut d'une offre :**

| Valeur stockée | Token généré |
|---|---|
| `"Active"` | `Active` |
| `"active"` | `active` *(différent du précédent !)* |

### Avantages
- Garantit une correspondance **exacte** : idéal pour les filtres sur des valeurs fixes (statuts, identifiants, codes)
- Aucune perte d'information : la valeur est indexée telle quelle
- Indispensable pour les champs d'**autocomplétion** avec stratégie `edgeGram` (préfixe depuis le début de la chaîne)

### Limitations
- **Sensible à la casse** : `"Paris"` ≠ `"paris"` — une coquille dans les données peut rendre un document introuvable
- **Correspondance totale uniquement** : chercher `"Atlas"` ne trouvera pas `"MongoDB Atlas"`
- **Inutilisable pour la recherche en texte libre** : une description de poste de 3 lignes ne sera jamais trouvée par un mot-clé partiel

### Idéal pour
Codes ROME, codes NAF/APE, identifiants SIRET, statuts (`"publié"`, `"archivé"`), codes postaux — tout champ où la valeur exacte compte.

---

## Language — `lucene.<langue>`

### Ce que c'est

Une famille d'analyzers **spécialisés par langue**, qui comprennent la morphologie de la langue cible. Chaque langue a son propre analyzer : `lucene.french`, `lucene.english`, `lucene.spanish`, etc.

L'exemple le plus pertinent pour ce projet est `lucene.french`.

### Comment il transforme le texte

Le pipeline complet pour `lucene.french` :

1. **Découpe** aux espaces et à la ponctuation
2. **Minuscules**
3. **Élision** : supprime les contractions françaises (`l'`, `d'`, `j'`, `c'`, `qu'`, `n'`, `s'`, `m'`, `t'`)
4. **Suppression des diacritiques** : `é` → `e`, `à` → `a`, `ê` → `e`, `ç` → `c`...
5. **Mots vides français** : retire `le`, `la`, `les`, `de`, `du`, `des`, `un`, `une`, `et`, `en`, `nous`, `vous`...
6. **Stemming** : réduit les mots à leur racine (`chercher`, `cherche`, `cherchons` → `cherch`)

**Exemple :**

| Étape | Résultat |
|---|---|
| Texte original | `"Nous recherchons l'alternance en développement"` |
| Après élision | `Nous recherchons alternance en développement` |
| Après minuscules | `nous recherchons alternance en développement` |
| Après mots vides | `recherchons alternance développement` |
| Après diacritiques | `recherchons alternance developpement` |
| Tokens finaux (après stemming) | `recherch` / `alternance` / `developpement` |

**Impact du stemming sur la recherche :**

| Requête utilisateur | Token généré | Correspond à | Document contenant |
|---|---|---|---|
| `"cherche"` | `cherch` | `cherch` | `"chercher"`, `"cherchons"`, `"recherche"` ✓ |
| `"liberté"` | `libert` | `libert` | `"libertè"`, `"liberte"`, `"liberté"` ✓ |
| `"alternance"` | `alternance` | `alternance` | `"l'alternance"`, `"en alternance"` ✓ |

**Cas concret — offres d'emploi en français :**

| Texte indexé | Tokens générés |
|---|---|
| `"Développeur JavaScript en alternance à Paris"` | `developpeur` / `javascript` / `alternance` / `paris` |

Une recherche sur `"développeurs"`, `"développeur"` ou `"developpeur"` (sans accent) trouvera ce document.

### Langues disponibles

MongoDB Atlas Search supporte plus de 30 langues, dont : `lucene.french`, `lucene.english`, `lucene.spanish`, `lucene.german`, `lucene.italian`, `lucene.portuguese`, `lucene.arabic`, `lucene.japanese`, `lucene.chinese`...

### Avantages
- **Tolérance aux accents** : `"éducation"` = `"education"` à la recherche
- **Tolérance aux variations morphologiques** : pluriels, conjugaisons, féminins... tous ramenés à la même racine
- **Élision française** : `"l'offre"` et `"offre"` sont équivalents
- Améliore significativement le **rappel** (trouver plus de résultats pertinents) pour du contenu en langue naturelle

### Limitations
- **Le stemming peut être trop agressif** : `"alternance"` et `"alternatif"` peuvent partager une racine commune et se retrouver liés dans les résultats
- **Suppression des mots vides** : une recherche sur `"le"` ou `"la"` retournera zéro résultat
- **Pas de correspondance exacte** : si vous avez besoin de trouver une chaîne précise, utilisez `lucene.keyword` ou un multi-analyzer
- **Un seul analyzer par champ** (sauf avec la fonctionnalité `multi`) : vous devez choisir entre précision exacte et richesse linguistique

### Astuce — combiner deux analyzers sur un même champ (multi-analyzer)

Il est possible d'indexer un champ avec **deux analyzers simultanément**, et de choisir lequel utiliser à la recherche. Exemple : indexer un titre d'offre avec `lucene.standard` ET `lucene.french`, pour pouvoir faire soit une recherche générale soit une recherche linguistiquement enrichie selon le contexte.

### Idéal pour
Tous les champs textuels en français : intitulés de poste, descriptions d'offres, noms de formations, compétences rédigées en langage naturel.

---

## Analyzer Custom — `custom`

### Ce que c'est

Quand aucun analyzer intégré ne correspond exactement à votre besoin, MongoDB permet de **construire le vôtre** en assemblant des briques élémentaires. Un analyzer custom est une combinaison de trois types de composants, appliqués dans l'ordre :

1. **Filtres de caractères** *(optionnels)* — transforment le texte brut **avant** la découpe (ex. : supprimer les balises HTML, remplacer des caractères)
2. **Tokenizer** *(obligatoire)* — découpe le texte en tokens selon une règle choisie
3. **Filtres de tokens** *(optionnels)* — transforment, suppriment ou enrichissent les tokens après la découpe (ex. : minuscules, stemming, suppression des mots courants)

> En résumé : on pré-traite le texte, on le découpe, puis on affine les morceaux obtenus.

---

### Les Tokenizers disponibles

| Tokenizer | Découpe sur | Particularité |
|---|---|---|
| `standard` | Espaces + ponctuation (intelligent) | Gère bien les emails, URLs |
| `whitespace` | Espaces uniquement | Conserve la ponctuation dans les tokens |
| `keyword` | Rien (texte entier = 1 token) | Pour la correspondance exacte |
| `edgeGram` | Génère des préfixes depuis le début | Idéal pour l'autocomplétion |
| `nGram` | Génère toutes les sous-chaînes possibles | Recherche par fragment, index volumineux |
| `regexSplit` | À chaque correspondance d'un regex | Découpe sur un motif personnalisé |
| `regexCaptureGroup` | Extrait le 1er groupe capturé par un regex | Pour extraire un format précis |
| `uaxUrlEmail` | Espaces + ponctuation, sauf URLs/emails | Préserve les URLs et adresses email entières |

**Exemples d'application :**

| Tokenizer | Texte | Tokens produits |
|---|---|---|
| `edgeGram` (min:2, max:4) | `"Paris"` | `Pa` / `Par` / `Pari` |
| `nGram` (min:2, max:3) | `"chat"` | `ch` / `ha` / `at` / `cha` / `hat` |
| `uaxUrlEmail` | `"contact@lba.fr et laformule.com"` | `contact@lba.fr` / `et` / `laformule.com` |
| `regexCaptureGroup` | `"01-23-45-67-89"` | `0123456789` (si le regex capture les chiffres) |

---

### Les Filtres de caractères disponibles

Ces filtres s'appliquent sur le texte brut, avant toute découpe :

| Filtre | Ce qu'il fait | Exemple |
|---|---|---|
| `htmlStrip` | Supprime les balises HTML | `<p>Bonjour</p>` → `Bonjour` |
| `mapping` | Remplace des caractères par d'autres | `-` → ` ` (tiret converti en espace) |
| `icuNormalize` | Normalise l'encodage Unicode | Formes composées/décomposées unifiées |

---

### Les Filtres de tokens disponibles

Ces filtres s'appliquent sur chaque token produit par le tokenizer :

| Filtre | Ce qu'il fait |
|---|---|
| `lowercase` | Met tout en minuscules |
| `uppercase` | Met tout en majuscules |
| `trim` | Supprime les espaces en début/fin de token |
| `length` | Supprime les tokens trop courts ou trop longs |
| `stopword` | Supprime une liste de mots définis (personnalisable) |
| `asciiFolding` | Supprime les accents : `é` → `e`, `ç` → `c` |
| `icuFolding` | Normalisation Unicode étendue (plus complète qu'`asciiFolding`) |
| `snowball` | Stemming par langue (French, English, Spanish...) |
| `porterStemming` | Stemming anglais (algorithme de Porter) |
| `kStemming` | Stemming anglais conservateur (produit de vrais mots) |
| `shingle` | Crée des tokens multi-mots (`"machine learning"` → token `machine_learning`) |
| `wordDelimiterGraph` | Découpe sur les changements de casse, chiffres, tirets (`camelCase` → `camel` / `Case`) |
| `regex` | Applique un remplacement par expression régulière sur chaque token |
| `reverse` | Inverse chaque token (pour recherche par suffixe) |
| `daitchMokotoffSoundex` | Encodage phonétique (noms qui sonnent pareil = même token) |
| `flattenGraph` | Aplatit le graphe de tokens (obligatoire après `wordDelimiterGraph`) |
| `englishPossessives` | Supprime le `'s` possessif anglais (`"team's"` → `"team"`) |
| `spanishPluralStemming` | Supprime les pluriels espagnols |

---

### Cas d'usage concrets

#### 1. Autocomplétion sur les intitulés de poste

**Problème :** l'utilisateur tape `"Dév"` et doit trouver `"Développeur JavaScript"`.

**Solution :** un tokenizer `edgeGram` qui génère tous les préfixes possibles.

| Ce qui est indexé | Tokens générés |
|---|---|
| `"Développeur"` | `de` / `dev` / `deve` / `devel` / `develo` / `develop` |

Une saisie partielle comme `"dév"` devient le token `dev` après normalisation (asciiFolding), qui matche `dev`.

---

#### 2. Recherche insensible aux accents en français

**Problème :** l'utilisateur tape `"education"` (sans accent) et doit trouver `"Éducation"`.

**Solution :** combiner `lowercase` + `asciiFolding` + `snowball French`.

| Texte indexé | Tokens produits |
|---|---|
| `"Éducation Nationale"` | `education` / `national` |

La recherche sur `"education"` ou `"éducation"` donne le même token `education`.

---

#### 3. Contenu HTML (descriptions d'offres avec mise en forme)

**Problème :** les descriptions sont stockées en HTML (`<p>Poste en <strong>alternance</strong></p>`) mais on veut chercher dans le texte pur.

**Solution :** ajouter `htmlStrip` comme filtre de caractères avant la découpe.

| Texte brut stocké | Après `htmlStrip` | Tokens finaux |
|---|---|---|
| `"<p>Poste en <b>alternance</b></p>"` | `"Poste en alternance"` | `poste` / `alternance` |

---

#### 4. Termes composés avec tirets (`full-stack`, `sign-in`)

**Problème :** `"full-stack"` et `"full stack"` doivent être équivalents.

**Solution :** utiliser un filtre de caractères `mapping` pour convertir `-` en espace avant la découpe.

| Texte brut | Après `mapping` (`-` → ` `) | Tokens finaux |
|---|---|---|
| `"Développeur full-stack"` | `"Développeur full stack"` | `développeur` / `full` / `stack` |

---

#### 5. Recherche phonétique sur les noms (tolérance aux fautes de frappe)

**Problème :** `"Dupont"` et `"Dupond"` doivent être considérés comme identiques.

**Solution :** utiliser `daitchMokotoffSoundex` pour encoder phonétiquement les noms.

| Nom | Code phonétique généré |
|---|---|
| `"Dupont"` | `394600` |
| `"Dupond"` | `394600` *(identique)* |

Les deux noms matcheront la même requête phonétique.

---

### Avantages
- **Flexibilité totale** : chaque étape est configurable selon vos données réelles
- **Combinaisons puissantes** : les filtres se chaînent, chaque filtre peut s'appuyer sur le résultat du précédent
- **Réutilisable** : une fois défini, un analyzer custom peut être appliqué à plusieurs champs
- **Coexistence** : un même champ peut avoir un analyzer par défaut ET un analyzer custom alternatif (via `multi`)

### Limitations
- **Exactement un tokenizer** par analyzer — on ne peut pas combiner plusieurs stratégies de découpe
- **Ordre fixe** : toujours `charFilters` → `tokenizer` → `tokenFilters`, sans possibilité de réorganiser
- **Noms réservés** : le nom de l'analyzer ne peut pas commencer par `lucene.`, `builtin.` ou `mongodb.`
- **`nGram` et `edgeGram` gonflent l'index** : plus les plages min/max sont larges, plus l'index est volumineux — à calibrer avec soin
- **`wordDelimiterGraph` nécessite `flattenGraph`** : si utilisé à l'indexation, il doit être suivi de `flattenGraph` pour éviter un comportement indéfini
- **Pas de logique conditionnelle** : un analyzer s'applique uniformément, on ne peut pas avoir un traitement différent selon la valeur du champ

### Idéal pour
Autocomplétion, recherche phonétique, contenu HTML, normalisation de formats spécifiques (numéros de téléphone, codes), ou tout besoin qui sort du cadre des analyzers intégrés.

---

## Normalizers — mention spéciale

Les **normalizers** sont similaires aux analyzers mais produisent toujours **un seul token** (pas de découpe). Ils s'utilisent uniquement sur les champs de type `token` (pour le filtrage et le tri exact).

| Normalizer | Comportement |
|---|---|
| `lowercase` | Met la chaîne entière en minuscules, sans la découper |
| `none` | Ne fait rien, conserve la valeur telle quelle |

**Exemple avec `lowercase` :**
- `"Paris"` → token `paris`
- `"PARIS"` → token `paris`
- Résultat : `"Paris"` = `"PARIS"` = `"paris"` pour le filtrage

---

## Comment choisir son analyzer ?

```
Mon champ contient...
│
├── Un code / identifiant / statut / valeur exacte
│   └── → lucene.keyword
│
├── Des tags techniques (Node.js, C++, TypeScript)
│   └── → lucene.whitespace
│
├── Du texte en français (offres, descriptions, titres)
│   └── → lucene.french
│
├── Du texte en anglais ou multilingue général
│   └── → lucene.standard
│
├── Des noms propres / libellés simples sans chiffres
│   └── → lucene.simple
│
└── Un besoin spécifique non couvert ci-dessus ?
    │
    ├── Autocomplétion (recherche par préfixe) → custom avec edgeGram
    ├── Contenu HTML → custom avec htmlStrip
    ├── Termes avec tirets (full-stack) → custom avec mapping charFilter
    ├── Recherche sans accents → custom avec asciiFolding
    └── Correspondance phonétique → custom avec daitchMokotoffSoundex
```

---

*Documentation MongoDB Atlas Search — version 8.2*
*Référence : https://www.mongodb.com/docs/atlas/atlas-search/analyzers/*
