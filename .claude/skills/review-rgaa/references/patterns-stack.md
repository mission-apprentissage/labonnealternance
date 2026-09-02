# Patterns accessibles pour la stack LBA — react-dsfr · MUI 7 · Next.js App Router · Formik

Ordre de préférence pour toute correction : **composant `@codegouvfr/react-dsfr`** → **MUI avec les bons `slotProps`** → **HTML natif**. Jamais de `div` cliquable, jamais de `tabIndex` positif, jamais d'`aria-live` doublé sur `role="alert"` / `role="status"`.

Conventions du repo : imports DSFR en sous-chemin (`@codegouvfr/react-dsfr/Button`), tokens `fr.cx()` / `fr.colors.decisions.*` / `fr.spacing()`, MUI `Box` / `Typography` / `Stack` pour la mise en page, `useId()` pour tout identifiant. Pages publiques : seulement `@mui/material` (cf. `ui/AGENTS.md`).

---

## 1. Titres et paragraphes (RGAA 8.9, 9.1)

`Typography` sépare **style** (`variant`) et **balise** (`component`). Un titre visuel est un titre sémantique, et réciproquement.

```tsx
// ❌ Titre simulé : rend <p> stylé comme un titre (finding 9.1)
<Typography variant="body1" fontWeight={700}>Description du métier</Typography>
<Typography className="fr-text--lead fr-text--bold">Psst, nous avons une info pour vous !</Typography>

// ✅ Balise de titre au bon niveau, style libre
<Typography variant="h5" component="h2">Description du métier</Typography>
<Typography component="h2" className={fr.cx("fr-h4")}>Psst, nous avons une info pour vous !</Typography>

// ❌ <h2> pour la taille sans rôle de titre (finding 8.9) → component="p" + className fr-h2
// ❌ Deux <h1> desktop/mobile → un seul <h1>, responsive via sx
// ❌ <Typography> (rend <p>) contenant un <Box> (rend <div>) → HTML invalide (8.2) : component="div" ou Box parent
// ❌ Paragraphe en <div><span> → <Typography component="p"> ou <p>
// ❌ Doubles <br /> → un <Typography component="p"> par paragraphe
```

Hiérarchie cible d'une page : `h1` = titre de page (unique, égal au `<title>` sans le suffixe), `h2` = sections, `h3` = sous-sections. Modale DSFR : `title` rendu en `h1` par défaut dans le `<dialog>`, ajustable via `titleAs`. `Accordion` DSFR : `titleAs="h3"` (défaut) à ajuster au niveau réel.

## 2. Landmarks et structure de page (9.2, 12.6, 12.7)

```tsx
// layout de groupe
<>
  <SkipLinks links={[{ label: "Contenu", anchor: "#main" }, { label: "Menu", anchor: "#header-links" }, { label: "Pied de page", anchor: "#footer-links" }]} />
  <Header {...DsfrHeaderProps} navigation={<DsfrHeaderNavigation />} />   {/* rend <header role="banner"> + <nav> */}
  <Box component="main" id="main" role="main" tabIndex={-1}>{children}</Box>
  <Footer />                                                                {/* <footer role="contentinfo" id="footer-links"> */}
</>
```

- Plusieurs `<nav>` → `aria-label` distinct : `Breadcrumb` DSFR pose déjà « vous êtes ici : » ; `MainNavigation` pose « Menu principal » ; une nav de section prend `aria-label="Sommaire"` (composant `Summary`).
- Deux arbres desktop/mobile alternés par `display` : chaque arbre a ses propres `id` et son propre `SkipLinks` (pattern `RechercheLayoutClient.tsx`). Ne jamais dupliquer un `id`.
- Page de processus sans header (recherche, détail, formulaire depuis mail) : garder `<main>`, un moyen de revenir à une page complète, et un lien d'aide à position stable (WCAG 3.2.6).
- Widget embarqué : ne pas proposer le lien d'évitement « Menu » si le header n'est pas rendu.

## 3. Titre de page (8.5, 8.6)

```tsx
// page.tsx (server)
export const metadata: Metadata = { title: METADATA.static.contact().title }   // "Contact - La bonne alternance"
// page dynamique
export async function generateMetadata({ params }): Promise<Metadata> { return { title: `${offre.title} - ${offre.company} - La bonne alternance` } }
```
Un seul `<title>` rendu : ne pas ajouter de `<title>` dans un composant client si `metadata` existe. En navigation client, Next met à jour `document.title` et son `next-route-announcer` l'annonce : vérifier qu'il change à chaque route.

## 4. Liens (6.1, 6.2, 13.2, 10.2)

Règle du nom accessible : **il commence par le texte visible**, puis précise (destination, « nouvelle fenêtre », format). Un `aria-label` qui remplace le texte visible casse la commande vocale (WCAG 2.5.3).

```tsx
// ✅ Lien interne : DsfrLink ou NextLink, texte explicite
<DsfrLink href={PAGES.static.faq.getPath()}>Consulter la FAQ</DsfrLink>

// ✅ Lien externe : mention nouvelle fenêtre dans le DOM (l'icône DSFR est en CSS pur : 10.2)
<DsfrLink href="https://…" external>
  Blog<span className={fr.cx("fr-sr-only")}> - nouvelle fenêtre</span>
</DsfrLink>
// ou title="Blog - nouvelle fenêtre" (le title doit reprendre l'intitulé visible en entier)

// ✅ Lien ambigu complété (pas d'aria-label qui écrase le texte)
<a href={mapsUrl} target="_blank" rel="noopener noreferrer">
  {adresse}<span className={fr.cx("fr-sr-only")}> - Localisation sur Google Maps - nouvelle fenêtre</span>
</a>

// ✅ Lien stylé bouton : linkProps, jamais <a> dans <Button> ni <Button> dans <a> (8.2, 12.8)
<Button priority="secondary" linkProps={{ href: PAGES.static.faq.getPath() }}>Consulter la FAQ</Button>

// ✅ Lien-image : alt = destination
<NextLink href="/"><Image src="/images/logo_LBA.svg" alt="Accueil - La bonne alternance" … /></NextLink>

// ✅ Lien icône seule
<a href={url} title="Signaler l'offre"><span className={fr.cx("fr-icon-flag-line")} aria-hidden="true" /><span className={fr.cx("fr-sr-only")}>Signaler l'offre</span></a>
```

`DsfrLink` (`ui/components/dsfr/DsfrLink.tsx`) pose `target="_blank"` + `rel` sur les liens externes mais **n'ajoute pas** la mention « nouvelle fenêtre » : la fournir dans les enfants ou faire évoluer le composant pour l'ajouter quand `isExternal` (correction transverse : critères 6.1, 10.2, 13.2 sur 27 pages).

Header DSFR : `homeLinkProps.title` doit reprendre tout le texte visible du bloc marque : « Accueil - La bonne alternance - République Française ». Footer DSFR : `brandTop`, `homeLinkProps.title` idem, `operatorLogo.alt` = nom de l'opérateur.

## 5. Boutons et icônes (7.1, 11.9, 1.1, 1.2, 10.2)

```tsx
// ✅ Bouton icône seule : react-dsfr exige title, qui devient le nom accessible ; ajouter le texte sr-only pour 10.2
<Button iconId="fr-icon-close-line" priority="tertiary" size="small" title="Fermer le détail de l'offre" onClick={close} />
// si le composant n'accepte pas de children : title suffit pour 7.1, ajouter aria-label identique n'est pas nécessaire

// ✅ Bouton texte + icône : l'icône DSFR est décorative par construction (aria-hidden posé par react-dsfr)
<Button iconId="fr-icon-add-line" iconPosition="left" onClick={add}>Ajouter un poste</Button>

// ✅ Bouton d'incrément dans un contexte : nommer l'action complète
<Button title="Ajouter un poste disponible" iconId="fr-icon-add-line" priority="secondary" onClick={inc} />

// ❌ title="close" / title="next" / title="label" (anglais : 8.7 ; non explicite : 7.1)
// ❌ <span className="fr-icon-question-line" onClick=…> : non focusable (7.3), sans nom (7.1)

// ✅ Icône informative seule (statut) : rôle image + nom
<span className={fr.cx("fr-icon-checkbox-circle-fill")} role="img" aria-label="Offre active" />
// ✅ Icône décorative à côté d'un texte
<span className={fr.cx("fr-icon-map-pin-2-fill")} aria-hidden="true" /> {adresse}
// ✅ SVG décoratif
<svg aria-hidden="true" focusable="false">…</svg>
// ✅ Image next/image porteuse d'info : alt = texte de l'image ; décorative : alt=""
```

MUI `IconButton` : toujours `aria-label`. Préférer `Button` DSFR.

## 6. Formulaires (11.x)

### Champ texte — DSFR d'abord

```tsx
const id = useId()
<Input
  id={id}
  label="Adresse e-mail"
  hintText="Format attendu : nom@domaine.fr"                       // 11.10 format en amont
  state={touched && error ? "error" : "default"}
  stateRelatedMessage={touched && error ? error : undefined}       // react-dsfr lie le message par aria-describedby et pose aria-invalid
  nativeInputProps={{ ...field, type: "email", autoComplete: "email", required: true, inputMode: "email" }}   // 11.13, 11.10
/>
```
`CustomDSFRInput.tsx` (Formik + `Input`) : passer `autoComplete` via `nativeInputProps` et `hintText` pour le format ; le `required` du `FormControl` MUI ne pose rien sur l'input.

### Champ texte — MUI quand le DSFR ne suffit pas

```tsx
const id = useId(); const helperId = `${id}-helper`
<TextField
  id={id}                                   // MUI lie label ↔ input et helperText ↔ aria-describedby à partir de cet id
  label="Téléphone"
  helperText={error ?? "Format attendu : 06 12 34 56 78"}
  error={Boolean(error)}                    // pose aria-invalid
  required
  slotProps={{ htmlInput: { autoComplete: "tel", inputMode: "tel", "aria-describedby": helperId }, formHelperText: { id: helperId } }}
/>
// Sans TextField : <FormLabel htmlFor={id}> + <Input id={id} /> + <FormHelperText id={helperId}> et aria-describedby sur l'input.
// Jamais <FormLabel> sans htmlFor à côté d'un <Input> sans id (finding 11.1 des pages P21, P22, P27).
```

### Cases à cocher, radios, groupes (11.1, 11.5, 11.6)

```tsx
// ✅ DSFR : legend obligatoire, association label/for gérée
<Checkbox legend="Quel(s) sujet(s) souhaitez-vous aborder ?" options={reasons.map(r => ({ label: r.label, nativeInputProps: { name: "reasons", value: r.value, checked, onChange } }))} state={…} stateRelatedMessage={…} />
<RadioButtons legend="Vous êtes" name="applicantType" options={[{ label: "L'étudiant", nativeInputProps: { value: "etudiant" } }, …]} />
// legend visuellement masquée si besoin : legend={<span className={fr.cx("fr-sr-only")}>Types de résultats</span>}

// ✅ MUI : RGAA exige <label for> explicite (le label englobant de FormControlLabel ne suffit pas)
const id = useId()
<FormControl component="fieldset">
  <FormLabel component="legend">Vous êtes</FormLabel>          {/* ou aria-labelledby vers un id existant et non vide */}
  <RadioGroup name="applicantType" aria-required="true">
    <FormControlLabel htmlFor={id} control={<Radio slotProps={{ input: { id } }} />} label="L'étudiant" />
  </RadioGroup>
</FormControl>
// Vérifier au runtime que for/id sont bien rendus ; sinon basculer sur RadioButtons DSFR.
```
`aria-labelledby` vers un élément **vide** ou absent = pas de légende (finding 11.6 accueil).

### Mention obligatoire, erreurs, focus (11.10, 12.8)

```tsx
// En tête de formulaire, dans l'ordre du DOM
<Typography component="p" className={fr.cx("fr-text--sm")}>Sauf mention contraire, tous les champs sont obligatoires.</Typography>
// ou : "Les champs marqués d'un * sont obligatoires" — et l'astérisque visuel : <span aria-hidden="true">*</span>

// À la soumission en erreur : focus sur le premier champ en erreur
const { errors, isSubmitting, isValidating } = useFormikContext()
useEffect(() => {
  if (isSubmitting && !isValidating) {
    const first = Object.keys(errors)[0]
    if (first) document.querySelector<HTMLElement>(`[name="${first}"]`)?.focus()
  }
}, [errors, isSubmitting, isValidating])
// Message d'erreur : nomme le champ et donne le format ("Le téléphone doit contenir 10 chiffres, ex. 0612345678")
```

### Autocomplétion / combobox (7.1, 7.3, 7.5, 11.1, 12.8)

```tsx
const labelId = useId(); const statusId = useId()
<Typography component="label" id={labelId} htmlFor={inputId}>Que recherchez-vous ?</Typography>
<Autocomplete
  id={inputId}                                    // MUI pose role="combobox", aria-expanded, aria-controls, aria-activedescendant sur l'input
  options={options} groupBy={o => o.group}
  renderInput={params => <TextField {...params} slotProps={{ htmlInput: { ...params.inputProps, "aria-labelledby": labelId, "aria-describedby": statusId } }} />}
  // Groupes : le rendu par défaut produit un <li> conteneur ; garantir role="presentation" sur le li et role="group" + aria-labelledby sur le <ul>
  renderGroup={params => {
    const gid = `${inputId}-group-${params.key}`
    return (
      <li key={params.key} role="presentation">
        <div id={gid} className="MuiAutocomplete-groupLabel" role="presentation">{params.group}</div>
        <ul role="group" aria-labelledby={gid} className="MuiAutocomplete-groupUl">{params.children}</ul>
      </li>
    )
  }}
/>
{/* 7.5 : zone live présente dès le premier rendu, mise à jour au changement des options */}
<div id={statusId} role="status" className={fr.cx("fr-sr-only")}>{isOpen ? `${options.length} suggestions disponibles, utilisez les flèches pour naviguer` : ""}</div>
```
Downshift (`useCombobox`) : passer `getLabelProps()` sur un vrai `<label>`, `getInputProps({ "aria-describedby": statusId })`, `getMenuProps()` sur le `<ul>`, `getItemProps()` sur chaque `<li>` (rôle `option`). Un `placeholder` seul n'est pas une étiquette (finding 11.1 P22, P23, P24).

### Dépôt de fichier (react-dropzone) (7.3, 11.10, 12.8, WCAG 2.5.7)

```tsx
const { getRootProps, getInputProps, open } = useDropzone({ noClick: true, noKeyboard: true, … })
<div {...getRootProps()}>                                                   {/* pas de tabIndex sur la div */}
  <input {...getInputProps()} id={fileId} aria-describedby={hintId} />     {/* un seul arrêt de tabulation */}
  <label htmlFor={fileId}>Votre CV</label>
  <p id={hintId}>PDF, DOCX ou JPG, 3 Mo maximum</p>
  <Button type="button" onClick={open}>Parcourir mes fichiers</Button>      {/* alternative au glisser-déposer */}
</div>
```

## 7. Composants interactifs

### Tooltip (7.1, 7.3, 10.13)

```tsx
// ✅ DSFR (déclencheur bouton, role="tooltip", aria-describedby, Échap gérés)
import { Tooltip } from "@codegouvfr/react-dsfr/Tooltip"
<Tooltip kind="click" title="La donnée Enseigne provient de l'INSEE et est déduite du SIREN.">
  <Button iconId="fr-icon-information-line" priority="tertiary no outline" size="small" title="Informations sur l'enseigne" />
</Tooltip>
// ✅ MUI : l'enfant doit être focusable ; describeChild pour un complément d'info, sinon le title devient le nom
<MuiTooltip title="…" describeChild><IconButton aria-label="Informations sur l'enseigne" size="small"><InfoIcon /></IconButton></MuiTooltip>
// ❌ <span className="fr-icon-information-line" onMouseEnter=…> (P22, P27 : 5 findings sur un seul composant)
```

### Modale (7.3, 12.9, 12.8)

```tsx
// ✅ DSFR : <dialog> natif, focus piégé, Échap, retour du focus, aria-labelledby sur le title
const modal = createModal({ id: "candidature", isOpenedByDefault: false })
<modal.Component title="Postuler à l'offre de …" iconId="fr-icon-mail-line" size="large">…</modal.Component>
<Button nativeButtonProps={modal.buttonProps}>J'envoie ma candidature</Button>
// ✅ MUI Dialog : aria-labelledby={titleId} + <DialogTitle id={titleId}>, onClose (Échap), focus géré par MUI
// Un bouton d'ouverture nommé « J'envoie ma candidature » ne prend pas un aria-label « Ouvrir le formulaire… » (2.5.3)
```

### Onglets (7.1, 12.8)

```tsx
// ✅ DSFR Tabs : rôles tablist/tab/tabpanel, flèches, aria-selected gérés
<Tabs tabs={[{ label: "Exposition", content: <Exposition /> }, { label: "Mise en relation", content: … }]} />
// ✅ MUI Tabs : a11yProps
<Tabs value={v} onChange={…} aria-label="Statistiques par étape">
  <Tab id={`tab-${i}`} aria-controls={`panel-${i}`} label="Exposition" />
</Tabs>
<div role="tabpanel" id={`panel-${i}`} aria-labelledby={`tab-${i}`} hidden={v !== i} tabIndex={0}>…</div>
// Un menu latéral (fr-sidemenu) qui change le contenu sans naviguer est un système d'onglets : <button> + aria-current="true", et focus déplacé sur le panneau (P05, P06)
```

### Menu d'actions (7.1, 7.3)

```tsx
<Button id={btnId} title="Actions sur l'entreprise Audit-Web" iconId="fr-icon-settings-5-line" priority="tertiary no outline"
        nativeButtonProps={{ "aria-haspopup": "menu", "aria-expanded": open, "aria-controls": menuId }} onClick={toggle} />
<Menu id={menuId} anchorEl={anchor} open={open} onClose={close} slotProps={{ list: { "aria-labelledby": btnId } }}>
  <MenuItem onClick={…}>Voir les offres</MenuItem>
</Menu>
```
Nommer l'action **avec son objet** (« Actions sur l'entreprise X ») : un `title="Actions sur l'entreprise"` répété N fois dans un tableau n'est pas explicite.

### Accordéon (7.1, 9.1)

`Accordion` DSFR : `label`, `titleAs` au niveau de la hiérarchie, `defaultExpanded`. `<details>/<summary>` (rendu Notion) : `summary` doit avoir `role="button"` ou être remplacé par l'`Accordion`.

## 8. Tableaux (5.4 à 5.7, 7.1, 7.3)

```tsx
// ✅ DSFR
<Table caption="Mes entreprises" headers={["Entreprise", "SIRET", <span className={fr.cx("fr-sr-only")}>Actions</span>]} data={rows} />
// ✅ Tableau maison (Table.tsx, TableWithPagination.tsx, VirtualTable.tsx) : caption (sr-only accepté), th scope="col" toujours textuels, tri par <button>
<th scope="col" aria-sort={sorted ? (desc ? "descending" : "ascending") : "none"}>
  <button type="button" onClick={toggleSort}>Entreprise<span className={fr.cx("fr-sr-only")}>, trier</span></button>
</th>
// ❌ role="hack", title="Toggle SortBy", icône de tri cliquable sans bouton (P26)
```

## 9. Zones live et chargements (7.5, 13.1)

```tsx
// Composant réutilisable : monté dès le départ, texte mis à jour ensuite
export function LiveStatus({ message }: { message: string }) {
  return <div role="status" className={fr.cx("fr-sr-only")}>{message}</div>
}
// Résultats de recherche / filtres : `${count} résultats affichés` après chaque changement de filtre
// Chargement : <CircularProgress aria-label="Chargement des résultats" /> + LiveStatus "Chargement en cours" puis "42 résultats"
// Erreur : <Alert severity="error" title="…" /> enveloppée dans <div role="alert"> si elle apparaît dynamiquement (l'Alert DSFR n'a pas de rôle live)
// Toast (useToast) : role="status", fermeture manuelle ou durée longue ; jamais d'action uniquement dans un toast qui disparaît
```

## 10. Navigation client, focus et session (12.8, 13.1, 10.7)

- Après un changement de contenu **sans** changement de route (filtre, tri, onglet, panneau) : déplacer le focus sur le titre du nouveau contenu (`<h2 tabIndex={-1} ref>` + `ref.current.focus()`) ou annoncer via `LiveStatus`.
- Après `router.push` : Next annonce le nouveau `<title>` ; si la page n'a pas de `<h1>` visible en haut, le focus reste où il était → poser `tabIndex={-1}` + focus sur `<main>` dans un `useEffect` dépendant de `pathname`.
- Fermeture d'un panneau ou d'une modale maison : rendre le focus au déclencheur (`triggerRef.current?.focus()`).
- Focus visible : ne jamais écrire `outline: "none"` sans `:focus-visible` équivalent ; le DSFR fournit l'outline, MUI aussi via `.Mui-focusVisible`. Header `sticky` : `scroll-padding-top` sur `html` (WCAG 2.4.11).
- Session espace pro : avertir avant expiration avec un bouton « Prolonger » (`role="alertdialog"`), ou durée ≥ 20 h. Tout `setTimeout` qui retire du contenu doit être annulable.

## 11. Couleurs et contrastes (3.1, 3.2, 3.3, 10.6)

- Utiliser `fr.colors.decisions.*` (contrastes garantis sur fond DSFR). Un hex en dur dans `sx` déclenche une vérification de ratio.
- État signalé par la couleur → ajouter texte ou icône + attribut ARIA (`aria-selected`, `aria-current`, `aria-invalid`, `aria-pressed`).
- Option survolée / focusée d'une liste : fond ≥ 3:1 avec le fond de la liste (finding 3.3 accueil) ; `Mui-focusVisible` sur les onglets ≥ 3:1 (finding 3.3 statistiques).
- Texte dans un tableau ou une légende de graphique < 24 px : 4,5:1 (finding 3.2 statistiques).

## 12. Langue (8.7)

Traduire les attributs : `title`, `aria-label`, `alt` en français (`previous`/`next`/`close`/`label`/`Toggle SortBy` relevés). Texte visible en anglais hors marque : `<span lang="en">Open source</span>`. Page widget de test en `lang="en"` : à passer en `fr` si le contenu est français.
