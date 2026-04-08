# Analyse du moteur de recherche — Choix des analyzers

> Ce document analyse la configuration actuelle du moteur de recherche Atlas Search de La Bonne Alternance, pose les questions clés pour orienter les choix, et propose plusieurs solutions concrètes avec leurs avantages et inconvénients.

---

## 1. État des lieux de la configuration actuelle

### Architecture de recherche

Le moteur repose sur un index Atlas Search `algolia_search` avec une stratégie **double clause** :

| Clause | Analyzer | Fonctionnalité |
|---|---|---|
| Clause 1 — recherche principale | `lucene.french` | Stemming français, élision, mots vides, + fuzzy (`maxEdits: 1`) |
| Clause 2 — expansion synonymes | `lucene.standard` (via `multi`) | Expansion d'abréviations (ex : `ccgo` → `Chef de chantier gros oeuvre`) |

Les deux clauses sont combinées en `should` avec `minimumShouldMatch: 1` (logique OU).

### Champs indexés pour la recherche textuelle

| Champ | Analyzer principal | Multi-analyzer | Type additionnel | Rôle |
|---|---|---|---|---|
| `title` | `lucene.french` | `lucene.standard` | — | Intitulé du poste ou de la formation |
| `description` | `lucene.french` | `lucene.standard` | — | Description détaillée |
| `keywords` | `lucene.french` | `lucene.standard` | — | Mots-clés associés (tableau de chaînes) |
| `organization_name` | `lucene.french` | `lucene.standard` | `token` | Nom de l'entreprise / organisme |

### Champs de filtrage (type `token`)

`type`, `type_filter_label`, `sub_type`, `contract_type`, `level`, `activity_sector`

### Ce qui fonctionne bien

- Le stemming français (`lucene.french`) gère les variations morphologiques : `développeur` / `développeurs` / `développement`
- L'élision gère les contractions : `l'alternance` → `alternance`
- Le fuzzy (`maxEdits: 1`) tolère une faute de frappe
- Les synonymes permettent de retrouver les intitulés par acronyme (`ccgo`, `ts`, `ecsi`...)
- Le tri par pertinence puis `smart_apply` puis `application_count` est cohérent

### Ce qui peut être amélioré

| Problème identifié | Impact | Exemple |
|---|---|---|
| **Pas d'autocomplétion** | L'utilisateur doit taper le mot entier avant d'obtenir des résultats | Taper `"dév"` ne trouve rien tant que le mot n'est pas assez complet |
| **Pas de boosting par champ** | Un match dans `title` pèse autant qu'un match dans `description` | Chercher `"boulanger"` remonte des offres où le mot n'apparaît que dans la description |
| **Pas de gestion des accents dans la recherche fuzzy** | `lucene.french` gère les accents via stemming, mais la recherche fuzzy n'a pas d'`asciiFolding` explicite | `"developpeur"` (sans accent) pourrait ne pas matcher `"développeur"` dans certains contextes |
| **Synonymes sur `lucene.standard` uniquement** | Les synonymes ne bénéficient pas du stemming français | Un synonyme défini comme `"informaticien"` ne matchera pas `"informaticiens"` (pluriel) via la clause synonymes |
| **Pas de recherche par sous-chaîne** | Les noms d'entreprises ou termes composés nécessitent le mot exact | Chercher `"Capge"` ne trouvera pas `"Capgemini"` |
| **`organization_name` traité comme du texte français** | Le stemming tronque les noms propres d'entreprises | `"Capgemini"` pourrait être racinisé inutilement |

---

## 2. Questions clés pour orienter les choix

### Q1 — Autocomplétion

> **L'autocomplétion est-elle un besoin prioritaire ?**
>
> Actuellement, la recherche ne se déclenche qu'à la soumission du formulaire. Si l'autocomplétion est souhaitée (suggestions en temps réel pendant la frappe), il faut ajouter un type `autocomplete` sur certains champs, ce qui impacte la taille de l'index et nécessite un endpoint dédié.
>
> - **Si oui** : sur quels champs ? `title` seul ? `title` + `organization_name` ? `title` + `keywords` ?
> - **À partir de combien de caractères** les suggestions doivent-elles apparaître ? (2, 3 ?)

### Q2 — Importance relative des champs

> **Quel est l'ordre de priorité des champs pour le classement des résultats ?**
>
> Exemple de pondération possible :
>
> | Champ | Poids proposé | Justification |
> |---|---|---|
> | `title` | ×10 | Un match dans le titre est le signal le plus fort |
> | `keywords` | ×5 | Les mots-clés sont ciblés et pertinents |
> | `organization_name` | ×3 | Important pour la recherche d'entreprise |
> | `description` | ×1 | Bruit potentiel (texte long, termes génériques) |
>
> Cette pondération vous semble-t-elle pertinente ? Faut-il ajuster ?

### Q3 — Tolérance aux fautes de frappe

> **Le niveau actuel de tolérance aux fautes (`maxEdits: 1`) est-il suffisant ?**
>
> - `maxEdits: 1` tolère une seule modification (insertion, suppression, substitution, transposition)
> - `maxEdits: 2` serait plus permissif mais risque de ramener du bruit (ex : `"chat"` matcherait `"chats"`, `"char"`, `"chaud"`, `"choix"`)
>
> **Constatez-vous des cas où des utilisateurs ne trouvent pas de résultats à cause de fautes de frappe ?**

### Q4 — Recherche par nom d'entreprise

> **Comment les utilisateurs cherchent-ils les entreprises ?**
>
> - Par nom exact (`"Capgemini"`) ?
> - Par début de nom / préfixe (`"Capge..."`) ?
> - Par acronyme (`"BNP"`) ?
>
> Aujourd'hui, `organization_name` est analysé avec `lucene.french` (stemming, mots vides). Or les noms d'entreprises sont des noms propres qui ne devraient pas être racinisés. Un analyzer `keyword` ou `whitespace` + `lowercase` serait peut-être plus adapté, éventuellement combiné avec un type `autocomplete` pour les préfixes.

### Q5 — Contenu HTML dans les descriptions

> **Les descriptions contiennent-elles du HTML ?**
>
> Si oui (balises `<p>`, `<strong>`, `<br>`, etc.), un filtre de caractères `htmlStrip` serait nécessaire dans un analyzer custom pour éviter d'indexer les balises comme du texte.

### Q6 — Termes composés avec tirets

> **Les intitulés contiennent-ils fréquemment des termes composés ?**
>
> Exemples : `"full-stack"`, `"e-commerce"`, `"aide-soignant"`, `"chef-de-projet"`
>
> Actuellement, `lucene.french` découpe sur les tirets : `"aide-soignant"` → `aide` / `soignant`. Cela fonctionne pour la recherche par mot, mais une recherche sur `"aidesoignant"` (en un mot) ne matcherait pas. Faut-il gérer cette variation ?

### Q7 — Langues des contenus

> **Les contenus sont-ils exclusivement en français ?**
>
> Si des offres contiennent de l'anglais (intitulés comme `"Data Engineer"`, `"Product Manager"`, `"Full Stack Developer"`), le stemming français pourrait les tronquer de manière incorrecte. Un multi-analyzer `lucene.english` pourrait être utile sur certains champs.

### Q8 — Volume de données et performance

> **Quel est l'ordre de grandeur du nombre de documents dans la collection `algolia` ?**
>
> - Moins de 100 000 : la taille de l'index n'est pas un problème, on peut se permettre des tokenizers `edgeGram` / `nGram` larges
> - 100 000 à 1 000 000 : optimiser les plages `minGram` / `maxGram`
> - Plus de 1 000 000 : chaque ajout d'analyzer impacte la taille de l'index et le temps de reconstruction

---

## 3. Solutions proposées

### Solution A — Optimisation ciblée (effort minimal, impact rapide)

**Principe :** garder l'architecture actuelle et corriger les points faibles identifiés sans changer les analyzers.

#### Modifications

**1. Ajouter le boosting par champ**

Actuellement, tous les champs sont recherchés avec le même poids. On sépare la recherche en clauses `should` avec des scores différents :

```
title      → boost ×10   (le titre est le signal le plus fort)
keywords   → boost ×5    (mots-clés ciblés)
organization_name → boost ×3 (recherche d'entreprise)
description → boost ×1   (contexte, pas de boost)
```

Un match dans `title` comptera 10× plus qu'un match dans `description` dans le score final.

**Exemple concret :**

| Requête | Document A (match dans title) | Document B (match dans description) |
|---|---|---|
| `"boulanger"` | titre : `"Boulanger en alternance"` → score ≈ 10 | description : `"...nous fournissons des équipements Boulanger..."` → score ≈ 1 |

Document A sera classé nettement devant.

**2. Ajuster le `prefixLength` du fuzzy**

Ajouter `prefixLength: 1` pour que le premier caractère doive correspondre exactement. Cela réduit le bruit sans sacrifier la tolérance :

```
Avant  : "chat" fuzzy → matche "chats", "char", "éhat", "bhat"
Après  : "chat" fuzzy (prefixLength:1) → matche "chats", "char" mais PAS "éhat", "bhat"
```

#### Avantages
- Aucune modification de l'index nécessaire (changements côté requête uniquement)
- Déploiement immédiat, pas de reconstruction d'index
- Amélioration mesurable du classement des résultats

#### Inconvénients
- Ne résout pas l'absence d'autocomplétion
- Ne résout pas le traitement inapproprié des noms d'entreprises
- L'architecture fondamentale reste la même

---

### Solution B — Analyzer custom français enrichi (effort modéré)

**Principe :** remplacer `lucene.french` par un analyzer custom qui combine le meilleur de `lucene.french` avec des capacités supplémentaires.

#### Définition de l'analyzer custom

```
Analyzer "lba_french" :
  1. Filtre de caractères : htmlStrip (si HTML dans les descriptions)
  2. Filtre de caractères : mapping (tirets → espaces : "aide-soignant" → "aide soignant")
  3. Tokenizer : standard
  4. Filtre de tokens : lowercase
  5. Filtre de tokens : asciiFolding ("développeur" → "developpeur", garde les deux formes)
  6. Filtre de tokens : stopword (liste française : le, la, les, de, du, des, un, une, et, en, nous, vous...)
  7. Filtre de tokens : snowball French (stemming français)
```

#### Ce que ça change concrètement

| Scénario | Avec `lucene.french` (actuel) | Avec `lba_french` (proposé) |
|---|---|---|
| Recherche `"developpeur"` (sans accent) | Dépend du stemming pour matcher `"développeur"` | `asciiFolding` garantit la correspondance dans tous les cas |
| Description en HTML `"<p>Poste en <b>alternance</b></p>"` | Les balises sont indexées comme du texte | `htmlStrip` nettoie avant l'indexation |
| Terme `"aide-soignant"` | Découpe en `aide` / `soignant` | Identique, mais `"aidesoignant"` (sans tiret) matche aussi grâce au mapping |
| Terme `"e-commerce"` | Découpe en `e` / `commerce` (le `e` seul est inutile) | Le tiret est converti en espace, puis `e` est filtré par la longueur minimale |

#### Analyzer dédié pour `organization_name`

```
Analyzer "lba_company" :
  1. Tokenizer : standard
  2. Filtre de tokens : lowercase
  3. Filtre de tokens : asciiFolding
  (PAS de stemming, PAS de mots vides — les noms d'entreprises sont des noms propres)
```

| Scénario | Avec `lucene.french` (actuel) | Avec `lba_company` (proposé) |
|---|---|---|
| `"Société Générale"` | `société` stemmé → `societ`, `générale` stemmé → `general` | `societe` / `generale` (minuscules, sans accents, mais mots complets) |
| Recherche `"BNP Paribas"` | `bnp` / `parib` (stemming aberrant) | `bnp` / `paribas` (mots préservés intacts) |
| Recherche `"La Poste"` | `poste` (le mot `la` est supprimé comme mot vide) | `la` / `poste` (les deux mots sont conservés) |

#### Avantages
- Contrôle total sur le pipeline d'analyse
- Gestion explicite des accents (pas de dépendance implicite au stemming)
- Nettoyage HTML si nécessaire
- Noms d'entreprises traités correctement avec un analyzer dédié

#### Inconvénients
- Nécessite une reconstruction de l'index
- Deux analyzers custom à maintenir
- La liste de mots vides française doit être définie manuellement (pas de liste intégrée comme dans `lucene.french`)
- Le stemming Snowball French peut avoir un comportement légèrement différent de celui intégré à `lucene.french` (pas d'élision automatique — il faudrait potentiellement un filtre d'élision dédié)

---

### Solution C — Architecture complète avec autocomplétion (effort important)

**Principe :** refondre l'index pour combiner recherche textuelle, autocomplétion, et boosting par champ, en utilisant la fonctionnalité `autocomplete` d'Atlas Search.

#### Nouvelle définition des champs de l'index

| Champ | Types d'index | Analyzer(s) | Objectif |
|---|---|---|---|
| `title` | `string` + `autocomplete` | `lucene.french` (string), `edgeGram` + `foldDiacritics` (autocomplete) | Recherche full-text + autocomplétion |
| `description` | `string` | `lucene.french` | Recherche full-text uniquement (pas d'autocomplete sur les descriptions) |
| `keywords` | `string` | `lucene.french` | Recherche full-text |
| `organization_name` | `string` + `autocomplete` + `token` | custom `lba_company` (string), `edgeGram` + `foldDiacritics` (autocomplete) | Recherche + autocomplétion + filtrage exact |

#### Configuration de l'autocomplétion

```
Type autocomplete sur "title" :
  - Tokenisation : edgeGram
  - minGrams : 3  (suggestions à partir de 3 caractères)
  - maxGrams : 15
  - foldDiacritics : true  ("dev" matche "Développeur")
```

**Exemples de comportement :**

| Saisie utilisateur | Tokens autocomplete générés à l'index pour `"Développeur"` | Correspondance ? |
|---|---|---|
| `"dév"` | `dev`, `deve`, `devel`, `develo`, `develop`, `developp`, `developpe`, `developpeu`, `developpeur` | Oui (`dev` matche) |
| `"bou"` | (tokens pour `"Boulanger"` : `bou`, `boul`, `boula`, `boulan`, `boulang`, `boulange`, `boulanger`) | Oui |
| `"inf"` | (tokens pour `"Informaticien"` : `inf`, `info`, `infor`, `inform`, `informa`, `informat`, ...) | Oui |

> Note : `foldDiacritics: true` fait que `"dév"` est normalisé en `"dev"` à la recherche, et `"Développeur"` est indexé avec des tokens sans accents. La correspondance est automatique.

#### Stratégie de requête à 3 clauses

```
compound:
  should (au moins 1 doit matcher) :
    1. text lucene.french sur title (boost ×10) + keywords (boost ×5) + description (boost ×1)
       → fuzzy maxEdits:1, prefixLength:1
    2. text lucene.standard sur title.standard + keywords.standard + description.standard
       → synonymes "lba_synonyms"
    3. autocomplete sur title (boost ×8)
       → fuzzy maxEdits:1
  filter :
    - type, contract_type, level, etc.
```

**Exemple de classement avec cette stratégie :**

| Requête `"boulang"` | Document | Clauses qui matchent | Score estimé |
|---|---|---|---|
| — | titre : `"Boulanger-pâtissier en alternance"` | Clause 1 (french, title ×10) + Clause 3 (autocomplete, ×8) | Très élevé |
| — | titre : `"Vendeur en boulangerie"` | Clause 1 (french, title ×10, match sur `boulangerie` via stemming) | Élevé |
| — | description : `"...secteur de la boulangerie..."` | Clause 1 (french, description ×1) | Faible |

#### Avantages
- Autocomplétion native : suggestions instantanées dès 3 caractères
- Boosting par champ : classement intelligent des résultats
- Gestion des accents explicite via `foldDiacritics`
- Compatible avec les synonymes existants
- Expérience de recherche moderne (type Google / Algolia)

#### Inconvénients
- **Index plus volumineux** : le type `autocomplete` avec `edgeGram` multiplie le nombre de tokens indexés
- **Reconstruction complète de l'index nécessaire**
- **Endpoint dédié pour l'autocomplétion** : nécessite un nouvel endpoint API pour les suggestions en temps réel (séparé de la recherche principale)
- **Temps de réindexation plus long** selon le volume de documents
- **Complexité de la requête** : 3 clauses à maintenir et ajuster

---

### Solution D — Architecture hybride (recommandation pragmatique)

**Principe :** appliquer immédiatement les gains rapides (Solution A), puis itérer vers la Solution C.

#### Phase 1 — Immédiat (aucune modification d'index)

1. **Boosting par champ** dans les requêtes :
   - `title` : ×10
   - `keywords` : ×5
   - `organization_name` : ×3
   - `description` : ×1
2. **`prefixLength: 1`** sur le fuzzy pour réduire le bruit
3. Mesurer l'impact sur la qualité des résultats

#### Phase 2 — Court terme (modification d'index)

4. **Analyzer custom `lba_company`** pour `organization_name` (sans stemming)
5. **Ajouter `asciiFolding`** via un analyzer custom `lba_french` si les accents posent problème
6. **`htmlStrip`** si les descriptions contiennent du HTML

#### Phase 3 — Moyen terme (si l'autocomplétion est prioritaire)

7. **Ajouter le type `autocomplete`** sur `title` et `organization_name`
8. **Créer un endpoint de suggestions** dédié (`GET /api/v1/search/suggest`)
9. Intégrer côté frontend (debounce 200-300ms, minimum 3 caractères)

#### Avantages
- Progression par étapes : chaque phase apporte de la valeur indépendamment
- La phase 1 est déployable sans aucune reconstruction d'index
- Le risque est maîtrisé : on mesure avant d'aller plus loin
- Chaque phase peut être validée par des tests utilisateurs

#### Inconvénients
- Plus lent qu'une refonte complète en une seule fois
- L'index sera modifié à chaque phase (mais pas de downtime avec Atlas Search)

---

## 4. Tableau récapitulatif des solutions

| Critère | Solution A | Solution B | Solution C | Solution D |
|---|---|---|---|---|
| **Effort** | Faible | Modéré | Important | Progressif |
| **Temps de mise en œuvre** | Immédiat | ~1 jour | ~3-5 jours | Itératif |
| **Reconstruction d'index** | Non | Oui | Oui | Phase 2-3 |
| **Autocomplétion** | Non | Non | Oui | Phase 3 |
| **Boosting par champ** | Oui | Oui | Oui | Phase 1 |
| **Gestion des accents** | Inchangée | Améliorée | Améliorée | Phase 2 |
| **Noms d'entreprises** | Inchangé | Amélioré | Amélioré | Phase 2 |
| **Nettoyage HTML** | Non | Si besoin | Si besoin | Phase 2 |
| **Impact sur la taille de l'index** | Nul | Faible | Modéré à élevé | Progressif |
| **Risque** | Très faible | Faible | Modéré | Très faible |

---

## 5. Prochaines étapes

Vos réponses aux questions de la section 2 permettront de :

1. **Valider ou ajuster la pondération** des champs (Q2)
2. **Décider de l'autocomplétion** : est-ce prioritaire ? sur quels champs ? (Q1)
3. **Choisir entre les solutions A/B/C/D** en fonction de l'effort acceptable et des priorités produit
4. **Identifier les problèmes spécifiques** (HTML, tirets, noms d'entreprises, multilinguisme) pour calibrer l'analyzer custom (Q4-Q7)
5. **Calibrer les paramètres** en fonction du volume de données (Q8)

---

*Document généré à partir de l'analyse du modèle `shared/src/models/algolia.model.ts` et du service `server/src/services/search/search.service.ts` — Mars 2026*
