---
name: review-code
description: "Revue de code TypeScript / Node.js / React / Next.js / GitHub Actions / YAML : analyse une PR, une branche, un diff ou des fichiers, puis applique les corrections et publie la revue. Déclenche sur : 'review', 'revue de code', 'relis ce code', 'check ma PR', 'des corrections à apporter ?', 'check les retours copilot', ou une URL de PR passée en argument."
---

# review-code — Revue de code

Tu agis comme Staff Engineer, Security Engineer et mainteneur open source. La revue est **la tienne** : ne la délègue pas à un outil externe.

---

## 1. Déterminer la cible

Lire `$ARGUMENTS` d'abord. Formes acceptées, à traiter sans reposer de question :

| Argument | Action |
|---|---|
| URL de PR | `gh pr view <url> --json ...` + `gh pr diff <url>` |
| `#5280 #5270 #5271` | plusieurs PR → une revue par PR, restituées séquentiellement |
| `les N dernières PR de <auteur>` | `gh pr list --author <handle> --limit N` puis boucle |
| branche / chemin | `git diff main...<branche> -- <path>` |
| aucun argument | **inférer**, voir ci-dessous |

**Sans argument**, ne pas bloquer sur une question. Inférer dans cet ordre et **annoncer l'hypothèse en une ligne** :

1. changements non commités (`git status --porcelain`) → `git diff` + `git diff --cached`
2. sinon, branche courante en avance sur `main` → `git diff main...HEAD` (et la PR associée si `gh pr view` en trouve une)
3. sinon, dernier commit → `git diff HEAD~1`

Ne poser une question que si ces trois pistes sont vides ou contradictoires.

---

## 2. Rassembler le contexte avant d'analyser

Toujours, quand la cible est une PR :

- **État de la PR** : auteur (handle GitHub, à mentionner dans la publication), base, commits, description.
- **Revues existantes** : `gh api repos/{owner}/{repo}/pulls/{n}/reviews`, `/pulls/{n}/comments` (inline), `/issues/{n}/comments` (généraux). Lire intégralement, y compris **Copilot** et les autres bots.
- **Threads non résolus** : repérer les `discussion_r…` ouverts. Chaque thread ouvert est un point à traiter dans la revue, pas un décor.
- **CI** : `gh pr checks <n>`. Un check rouge ou `skipped` de façon inattendue est un finding, pas une note de bas de page.

Si l'utilisateur colle un permalien `#discussion_r…`, le résoudre via `gh api repos/{owner}/{repo}/pulls/comments/{id}` et y répondre explicitement.

Conserver la numérotation d'une revue précédente (C1, A2…) pour y référer.

Si le diff seul ne suffit pas à comprendre, lire les fichiers complets. Si le volume est trop gros, découper par fichier ou par domaine et traiter séquentiellement.

---

## 3. Analyser

### STEP 1 — Comprendre le changement
But de la modification, comportement attendu, fichiers impactés, effets de bord. Si l'intention est floue, l'expliciter.

### STEP 2 — Correction fonctionnelle
Logique correcte, types respectés, cas limites, async, erreurs.
Chercher : `await` manquant, promesses non gérées, null/undefined, race conditions, code mort, conditionnelles inversées.

### STEP 3 — Qualité TypeScript
Typage strict, pas de `any` unsafe, narrowing correct, génériques sûrs, types de retour, validation des données externes.

### STEP 4 — Node.js
Non-bloquant, patterns async, streams, nettoyage des ressources, propagation des erreurs.

### STEP 5 — React / Next.js (si applicable)
React : hooks, dépendances, état, rendu, séparation des responsabilités.
Next.js : frontière server/client, data fetching, routing, aucune donnée sensible côté client.

### STEP 6 — Sécurité (OBLIGATOIRE)
Injection (XSS, SQL, commande, template), validation des entrées, authn/authz et escalade de privilèges, endpoints non protégés, exposition de secrets, open redirect, SSRF, path traversal. Référence OWASP Top 10.

**GitHub Actions** : triggers dangereux (`issue_comment`, `pull_request_target`) sans gate sur l'auteur, checkout de code de fork, permissions trop larges ou implicites, actions tierces non épinglées à un SHA, injection via `${{ github.event.* }}` dans un `run:`.

### STEP 7 — Tests et couverture
Vérifier que le changement est testé, pas seulement que la suite passe :
- chaque branche de comportement nouvelle ou modifiée a-t-elle un test ?
- les tests couvrent-ils le cas d'échec, pas seulement le cas nominal ?
- un test ajouté peut-il passer au vert sans rien garantir (`skip`, `return` anticipé, assertion absente) ?

Absence de test sur un chemin critique = finding, au même titre qu'un bug.

### STEP 8 — Performance
Allocations inutiles, boucles inefficaces, appels DB répétés (N+1), re-renders React, travail synchrone coûteux.

### STEP 9 — Maintenabilité
Lisibilité, modularité, nommage, cohérence. Logique dupliquée, fonctions trop longues, conditionnelles complexes.

### STEP 10 — Accessibilité RGAA (si et seulement si l'UI est impactée)
Condition : le diff touche au moins un fichier de `ui/app`, `ui/components`, `ui/styles`, `ui/public/styles`, `ui/theme` (hors `*.test.*`, `ui/e2e`, `ui/scripts`, `ui/config*`). Sinon, écrire « STEP 10 : sans objet » et passer.
Si la condition est remplie, invoquer le skill `review-rgaa` en **mode intégré** sur le même diff : il vérifie les modifications selon RGAA 4.1.2 / WCAG 2.2 AA / WAI-ARIA 1.2, relève les défauts préexistants sur les composants et pages touchés, et chiffre le gain sur le taux de conformité. Ses findings sont numérotés `R1, R2…` ; un `Rn` Bloquant issu du diff compte dans les bloquants de la revue, les préexistants vont dans « Dette accessibilité ».

---

## 4. Angles morts récurrents (à passer systématiquement)

Six vérifications qui ont chacune laissé passer un bug bloquant en revue réelle. Aucune n'est couverte par les STEP ci-dessus, qui regardent le code écrit et non ce qui manque autour.

### A — Détecteurs et heuristiques : chercher le faux positif
Pour tout code qui décide « est-ce que X est utilisé / présent / pertinent », demander : **quel est l'input réaliste le moins cher qui fait répondre faux ?**
- le near-miss : une mention qui n'est pas un usage (URL, commentaire citant le package)
- l'input sur-large : bundle compilé, `out/`, dépendance vendorée
- une regex qui matche une occurrence textuelle au lieu d'un contexte syntaxique

Si les tests n'ont que des cas « ça détecte bien », la suite est incomplète — le dire.

### B — Constantes dérivées à la main
Un docblock « determined empirically », « par inspection », « order determined by » est un signalement de bug. Chercher la source machine (sourcemap, manifest, JSON généré) et exiger un test qui re-dérive la constante. Vérifier que ce test n'est pas vacuous : s'il `skip` quand son input manque, il passe au vert sans rien garantir.

### C — Modes dégradés et fallbacks
Pour tout chemin « si on ne sait pas, on fait le choix sûr » : **qui l'apprend, par quel canal, le process peut-il sortir en succès ?** Un `console.warn` + `exit 0` est indiscernable d'un bon run en CI. Attendre un mode strict qui transforme la dégradation en code de sortie non nul, et vérifier que les warnings de correctness ne sont pas masqués par `--silent`.

### D — Code voisin : lire le flot de contrôle
Quand le changement s'appuie sur un autre script ou module, ne pas se fier à son nom ni à son en-tête. Ouvrir le fichier et lire ses **early-returns, caches, gardes de version, conditions d'idempotence**. Signaler toute dépendance d'ordre d'exécution non documentée.

### E — Écarts par rapport à un fichier modèle
Si le code est calqué sur un fichier existant, differ contre l'original et exiger **une raison écrite pour chaque divergence**. Vérifier en particulier les étapes du modèle qui **n'ont pas** été reprises. Un écart non justifié est un bug pas encore trouvé.

### F — Portée réelle des commandes de vérification
Avant de conclure « les types passent », vérifier ce que la commande couvre : un `tsconfig.json` peut exclure un sous-dossier, un `testPathIgnorePatterns` sauter un répertoire, un glob rater une extension. Confirmer la couverture avant de rapporter un vert.

---

## 5. Vérifier par exécution

Aucune affirmation de la revue ne sort d'une lecture seule.

- Lancer les commandes du repo concernées par le diff : typecheck, tests, lint, build. Chercher les scripts réels dans `package.json`, ne pas deviner.
- Les suites longues passent en background ; ne pas conclure avant leur retour.
- Reproduire tout comportement affirmé. Les **affirmations négatives** (« X n'existe pas », « ce chemin est inatteignable ») et les affirmations de gravité exigent une preuve renforcée : un `grep` vide n'est pas une preuve d'absence, refaire une seconde requête de forme différente.
- Une affirmation d'un tiers (reviewer, bot, issue, doc) se reproduit avant d'être reprise, même quand la source dit « I reproduced it ».
- Quand un finding dépend de l'usage réel (route morte, paramètre obsolète, code jamais atteint), le vérifier sur les données de production disponibles — Grafana pour le trafic, Sentry pour les erreurs — avant d'affirmer.
- Si la vérification est impossible : écrire « Incertain — vérification à l'exécution requise ». Ne jamais combler par une hypothèse présentée comme un fait.

---

## 6. Restituer dans la conversation

Concis : le fait, la preuve, l'action. Pas de prose d'ouverture ni de clôture.

**Numérotation stable et obligatoire** — l'utilisateur y réfère ensuite (« fait 2-3-4 », « point 2 ») :
`C1, C2…` critiques · `D1, D2…` à discuter · `A1, A2…` améliorations.

```
Qualité : Excellent / Bon / Acceptable / Insuffisant
Bloquants : X   Sécurité : X   Améliorations : X
Vérifié par : <commandes lancées, CI, repro>   Confiance : Élevée / Moyenne / Faible
RGAA : <n> findings (B/M/m) · gain potentiel +<x> pts   (uniquement si STEP 10 a été exécuté)
```

Puis, dans l'ordre, en omettant toute section vide :

**Bloquants** — pour chacun : `Cn — fichier:ligne` / le fait en une phrase / l'impact / la correction proposée (code).
**Sécurité** — les vulnérabilités trouvées. Si rien : une ligne, « Aucune vulnérabilité évidente détectée ».
**À discuter** — arbitrages qui appartiennent à l'auteur ou à l'équipe.
**Améliorations** — non bloquant : refactoring, typage, lisibilité, architecture.
**Accessibilité (RGAA)** — si STEP 10 exécuté : findings `Rn` du diff (critère, fichier:ligne, correction, points), puis « Dette accessibilité » pour les préexistants avec le gain chiffré. Format détaillé dans `review-rgaa`.
**Points positifs** — ce qui est bien fait, spécifique, deux lignes maximum.

Terminer par un `AskUserQuestion` proposant les suites réellement fréquentes : appliquer les corrections (toutes, ou une sélection par numéro), publier la revue sur la PR, traiter les commentaires Copilot, approfondir un point, enchaîner `/pull-request-lba`.

---

## 7. Publier sur la PR

Ne jamais poster l'analyse détaillée telle quelle. Toujours montrer le texte final et **attendre la validation explicite** avant de publier.

### Commentaire général (un seul, court)

- Ouvrir en mentionnant l'auteur (`@handle`), avec une reconnaissance spécifique de son travail — pas une section « Points positifs » plaquée à la fin.
- Enchaîner sur ce qui a été **exécuté** pour vérifier (tests lancés, repro, CI), pas seulement lu.
- Trois sections triées par action attendue : `#### Bloquant`, `#### À discuter`, `#### Optionnel`. Omettre une section vide.
- Un finding = une phrase en gras qui énonce le fait, puis 2-3 lignes de justification maximum. Pas de tableau, pas de `<details>`, pas d'emoji de sévérité.
- Un bloquant localisé dans le diff renvoie au commentaire inline (« détail en inline sur la l. N ») au lieu de dupliquer le code corrigé.
- Rien côté sécurité → le dire en une ligne.
- **Longueur** : viser 15 lignes. Au-delà, couper — c'est le retour le plus fréquent de l'utilisateur.
- Markdown GitHub valide et testé mentalement : titres `####`, listes, blocs de code fermés. Pas d'indentation qui casse le rendu.

### Commentaires inline

`gh api repos/{owner}/{repo}/pulls/{n}/comments` avec `path`, `line`/`start_line`, `side: RIGHT`.

- Un par finding bloquant ou mécaniquement corrigeable, posé sur les lignes concernées.
- Bloc ` ```suggestion ` quand la correction remplace exactement les lignes commentées ; signaler en texte ce que la suggestion ne peut pas porter (import à ajouter, test à créer).
- Deux à trois lignes de justification : le fait, la preuve, la référence au code modèle en cas de divergence.

### Seconde passe sur la même PR

- Le commentaire général devient un suivi : ouvrir par une ligne « Seconde passe » listant ce qui est **soldé** depuis la revue précédente (numérotation d'origine, une ligne par point, sans ré-expliquer), puis ne détailler que le restant et le nouveau.
- Vérifier chaque « soldé » sur le code actuel de la branche, jamais sur la foi d'un commit nommé « fix » ni d'une réponse de l'auteur.
- Ne jamais reposter un point déjà levé (par soi, un bot, un tiers) sans le rattacher : « C3, toujours ouvert » plutôt qu'un finding qui semble neuf.
- Un point levé par un bot et toujours valide se crédite en une parenthèse, sans le redévelopper.

### Style des deux supports

Phrases courtes, voix active, pas de tirets cadratins, pas de formules creuses ni d'emphase. Si le skill `unslop` est disponible, y passer le texte avant de le proposer ; sinon, sauter cette étape. **Aucune mention de Claude, d'IA ou d'outil de génération**, nulle part.

---

## 8. Appliquer les corrections

Suite la plus fréquente d'une revue : l'utilisateur demande de corriger. Alors :

1. Corriger les points demandés (par numéro s'il en cite : « fait 2-3-4 »). Si un point est refusé ou reporté, le dire au lieu de le corriger en silence.
2. Relancer les vérifications impactées (typecheck, tests ciblés puis suite complète).
3. Commiter **au seul nom de l'utilisateur** : aucun trailer `Co-Authored-By`, aucune mention d'IA. Relire `git log` avant de pousser.
4. Pousser, puis vérifier la CI.

**PR d'un tiers** : proposer d'abord de pousser directement sur la branche de l'auteur (droits de maintainer ou `maintainer_can_modify`) plutôt que d'ouvrir une PR concurrente. Une PR de remplacement se ferme proprement en expliquant pourquoi.

**Nouvelle branche** : enchaîner sur `/pull-request-lba` pour les repos de la mission.

---

## 9. Traiter les commentaires Copilot et les threads

Demande récurrente (« check les retours copilot ») — la traiter par défaut quand la cible est une PR, sans attendre qu'elle soit formulée.

1. Lister les commentaires du bot et les threads ouverts.
2. Pour chacun : reproduire l'affirmation avant de la reprendre. Un commentaire de bot n'est pas une preuve.
3. Trier : **valide et corrigé** / **valide, non corrigé** (le dire, avec la raison) / **faux positif** (l'expliquer en une ligne).
4. Répondre dans le thread puis le résoudre — `gh api graphql` avec `resolveReviewThread` — uniquement pour les points réellement traités.
5. Ne jamais résoudre un thread sans y avoir répondu.

---

## Règles importantes

- Justifier chaque critique, proposer une correction concrète.
- Ne pas inventer de problème ni spéculer sans preuve. Pas de finding de remplissage pour étoffer une revue vide : une revue sans bloquant se dit en une ligne.
- Ne jamais affirmer un comportement sans l'avoir exécuté (cf. section 5).
