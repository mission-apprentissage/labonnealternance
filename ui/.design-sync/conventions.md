# La Bonne Alternance — DSFR + MUI

Ce design system = les composants **react-dsfr** (Système de Design de l'État français, DSFR) + un sous-ensemble **MUI** rendu sous le thème DSFR. Tout est sur `window.LbaDs`. Construis toujours avec ces composants ; n'invente pas de composants ni de classes CSS maison.

## Wrapping obligatoire

Enveloppe TOUT l'arbre dans `<LbaDsProvider>` (exporté sur `window.LbaDs`). Il initialise react-dsfr (`startReactDsfr`) **et** applique le thème DSFR à MUI. **Sans lui, les composants DSFR jettent « react-dsfr not initialized » et ne rendent rien**, et MUI perd les tokens DSFR.

> **Intégration dans l'app La Bonne Alternance (`ui/`) :** `LbaDsProvider` est un wrapper de commodité propre à cet environnement de design. Dans l'app Next.js réelle, ce setup **existe déjà au niveau du layout** : `DsfrProvider` (`app/dsfr-setup/`, via `@codegouvfr/react-dsfr/next-app-router`) + `MuiDsfrThemeProvider` (`app/client_only_providers.tsx`). **Ne le ré-instancie donc pas** en reprenant un design : monte simplement les composants — ils sont déjà sous les bons providers. `LbaDsProvider` = le raccourci mental pour « ce setup racine déjà en place ».

```jsx
const { LbaDsProvider, Button, Alert, Card, Typography } = window.LbaDs
<LbaDsProvider>
  <Card title="Développeur·se web en alternance" desc="Contrat d'apprentissage · Paris"
        end={<Button priority="primary">Postuler</Button>} border background />
</LbaDsProvider>
```

## L'idiome de style : des PROPS, pas des classes

Les composants react-dsfr se stylent **par props sémantiques**, jamais par className. N'écris pas de CSS pour eux — passe la bonne prop :

| Prop | Composants | Valeurs |
|---|---|---|
| `priority` | Button | `primary` \| `secondary` \| `tertiary` \| `tertiary no outline` |
| `severity` | Alert, Badge, Notice | `info` \| `success` \| `warning` \| `error` (Badge ajoute `new`) |
| `size` / `small` | Button, Card, Tag, Alert… | `small`/`medium`/`large`, ou `small` booléen |
| `state` + `stateRelatedMessage` | Input, Select, Upload | `default` \| `info` \| `success` \| `error` |
| `iconId` | Button, Card, CallOut… | classe `fr-icon-*` (voir plus bas) |

Détails d'API par composant : lis le `.prompt.md` et le `.d.ts` de chaque composant (`_ds/<...>/components/general/<Name>/`). Beaucoup de composants DSFR prennent des données structurées, pas des enfants libres : `Checkbox`/`RadioButtons` → `options: [{label, nativeInputProps}]` ; `Breadcrumb` → `segments: [{label, linkProps}]` ; `Table` → `headers` + `data` ; `SegmentedControl` → `segments` (tous avec icône OU tous sans).

## Icônes

`iconId="fr-icon-<nom>"`. Seules les icônes DSFR embarquées rendent ; les fréquentes : `fr-icon-search-line`, `fr-icon-account-line`, `fr-icon-briefcase-line`, `fr-icon-map-pin-2-line`, `fr-icon-mail-send-line`, `fr-icon-arrow-right-line`, `fr-icon-download-line`, `fr-icon-external-link-line`, `fr-icon-info-fill`, `fr-icon-checkbox-circle-line`.

## MUI thémé (layout & typo)

`Box`, `Typography`, `Stack`, `Grid`, `Container`, `Divider` viennent de MUI mais **héritent des tokens DSFR** (police Marianne, Bleu France). Utilise-les pour ta glue de mise en page ; style via props MUI (`sx`, `spacing`, `variant`). Ces composants MUI exigent la prop `component` (ex : `<Typography component="h2" variant="h4">`, `<Stack component="div">`). Les couleurs sémantiques MUI (`color="primary"|"success"|"error"`) mappent sur les tokens DSFR.

## Tokens pour ta propre glue

Pour du CSS de layout que tu écris toi-même, utilise les variables DSFR (définies dans la closure `styles.css`), jamais des hex en dur :
- Couleur principale : `var(--text-action-high-blue-france)` / `var(--background-action-high-blue-france)` = Bleu France `#000091`.
- Texte : `var(--text-title-grey)`, `var(--text-default-grey)`, `var(--text-mention-grey)`.
- Surfaces : `var(--background-default-grey)`, `var(--background-alt-grey)`, `var(--border-default-grey)`.

La vérité vit dans `styles.css` (et son closure `@import`) pour les tokens, et dans le `.prompt.md` de chaque composant pour l'API. Lis-les avant de styler.
