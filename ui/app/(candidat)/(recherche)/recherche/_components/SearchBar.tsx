"use client"

import { fr } from "@codegouvfr/react-dsfr"
import type { PopperProps } from "@mui/material"
import { Box, TextField } from "@mui/material"
import Autocomplete from "@mui/material/Autocomplete"
import { useQuery } from "@tanstack/react-query"
import type { ReactNode } from "react"
import { useCallback, useEffect, useId, useRef, useState } from "react"
import { searchAddress } from "@/services/base-adresse"
import { apiGet } from "@/utils/api.utils"

function useThrottle(value: string, delay: number) {
  const lastUpdateRef = useRef<number | null>(null)
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const now = Date.now()
    if (lastUpdateRef.current === null || now - lastUpdateRef.current >= delay) {
      lastUpdateRef.current = now
      setDebouncedValue(value)
      return
    }
    const timeout = setTimeout(() => {
      lastUpdateRef.current = now
      setDebouncedValue(value)
    }, delay)
    return () => clearTimeout(timeout)
  }, [value, delay])

  return debouncedValue
}

const fieldSx = (error?: boolean) => ({
  ".MuiInputBase-input": { fontSize: "1rem" },
  ".MuiOutlinedInput-root": {
    minHeight: 48,
    backgroundColor: "#FFFFFF",
    borderRadius: "4px",
  },
  ".MuiOutlinedInput-notchedOutline": {
    border: `1px solid ${error ? fr.colors.decisions.border.plain.error.default : fr.colors.decisions.border.default.grey.default}`,
  },
  ".MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline": {
    border: `1px solid ${error ? fr.colors.decisions.border.plain.error.default : fr.colors.decisions.border.default.grey.default}`,
  },
  ".MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
    border: "2px solid #0a76f6",
  },
})

const POPPER_PAPER_SX = { mt: "4px", borderRadius: "4px", py: "8px", boxShadow: "0 6px 18px rgba(0,0,18,0.16)" }

// Mode inlineSuggestions : le paper se borne à l'espace restant sous le champ (le calc retranche
// son mt) et la liste scrolle à l'intérieur ; la hauteur vient du flex de l'écran de saisie, pas
// du cap 40vh de MUI.
const INLINE_PAPER_SX = { ...POPPER_PAPER_SX, maxHeight: "calc(100% - 4px)", display: "flex", flexDirection: "column" } as const
// overscroll contain : arrivé en butée, le scroll de la liste ne doit pas chaîner vers la
// page derrière la modale (surtout iOS).
const INLINE_LISTBOX_SX = { maxHeight: "none", minHeight: 0, overflowY: "auto", overscrollBehavior: "contain" } as const

/**
 * Slot popper du mode inlineSuggestions : MUI rend ce conteneur dans le flux, sous le champ, au
 * lieu de la couche flottante popper.js — le clavier virtuel ne peut pas recouvrir la liste.
 * Les props de positionnement (anchorEl, placement, largeur…) sont volontairement ignorées.
 */
function InlineSuggestionsContainer({ open, children, className }: PopperProps) {
  if (!open) return null
  return (
    <Box className={className} sx={{ flex: "1 1 auto", minHeight: 0, width: "100%" }}>
      {typeof children === "function" ? children({ placement: "bottom-start" }) : children}
    </Box>
  )
}

/**
 * Cap la hauteur de la liste de suggestions à l'espace visible SOUS le champ : sur mobile,
 * le clavier virtuel réduit le visualViewport (pas le layout viewport) et masquerait le bas
 * de la liste (40vh par défaut MUI). Écoute resize/scroll du visualViewport tant que le
 * dropdown est ouvert — le clavier s'anime APRÈS l'ouverture. Desktop : le calcul dépasse
 * 40vh et le `min()` le neutralise.
 */
function useListboxMaxHeight() {
  const [maxHeight, setMaxHeight] = useState<string>("40vh")
  const inputRef = useRef<HTMLElement | null>(null)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const update = () => {
      const input = inputRef.current
      if (!input) return
      const vv = window.visualViewport
      const visibleBottom = vv ? vv.height + vv.offsetTop : window.innerHeight
      const available = Math.floor(visibleBottom - input.getBoundingClientRect().bottom - 12)
      setMaxHeight(available > 0 ? `min(40vh, ${available}px)` : "40vh")
    }
    update()
    const vv = window.visualViewport
    vv?.addEventListener("resize", update)
    vv?.addEventListener("scroll", update)
    return () => {
      vv?.removeEventListener("resize", update)
      vv?.removeEventListener("scroll", update)
    }
  }, [open])

  return {
    maxHeight,
    inputRef,
    onOpen: () => setOpen(true),
    onClose: () => setOpen(false),
  }
}

/**
 * Sous-chaîne matchée en gras dans les suggestions ("La **Coiff**erie"), insensible à la
 * casse et aux accents. Le mapping des index reste 1:1 : chaque code point est normalisé
 * individuellement (on ne garde que le caractère de base).
 */
export function highlightMatch(label: string, input: string): ReactNode {
  const query = input.trim()
  if (!query) return label
  const normalizeChar = (c: string) => c.normalize("NFD")[0].toLowerCase()
  const labelChars = [...label]
  const normalized = labelChars.map(normalizeChar).join("")
  const needle = [...query].map(normalizeChar).join("")
  const start = normalized.indexOf(needle)
  if (start < 0) return label
  const end = start + [...query].length
  return (
    <>
      {labelChars.slice(0, start).join("")}
      <Box component="span" sx={{ fontWeight: 700 }}>
        {labelChars.slice(start, end).join("")}
      </Box>
      {labelChars.slice(end).join("")}
    </>
  )
}

type LieuOption = { label: string; latitude: number; longitude: number; adminArea?: string; displayLabel?: string }

// Identité d'une option lieu : le libellé ne suffit pas, une région et une commune peuvent
// s'appeler « Bretagne ».
const lieuOptionKey = (o: LieuOption) => o.adminArea ?? o.label

// Option « France entière » : proposée quand le champ est vide, elle retire le lieu de la
// recherche tout en s'affichant dans le champ comme un lieu ordinaire. Le champ vide garde le
// placeholder (l'adresse et le code postal sont acceptés sans y être annoncés).
const FRANCE_ENTIERE_OPTION = { kind: "france_entiere", label: "France entière" } as const
const isFranceEntiereLabel = (s: string) => s.trim() === FRANCE_ENTIERE_OPTION.label
type LieuDropdownOption = LieuOption | typeof FRANCE_ENTIERE_OPTION

// Options du champ métier : la ligne « Rechercher : {saisie} » (toujours 1ʳᵉ) puis les
// suggestions. Objets discriminés plutôt que chaînes : une suggestion identique à la saisie
// ferait doublon de libellé et de key, et l'origine doit suivre la valeur jusqu'à la télémétrie.
type MetierOption = { kind: "free_text"; value: string } | { kind: "suggestion"; value: string }

interface SearchBarProps {
  initialQ?: string
  initialLieuLabel?: string
  /**
   * Page de résultats : sans lieu dans l'URL, la recherche porte sur la France entière et le
   * champ l'affiche (le choix fait sur la home n'a pas de trace dans l'URL, « aucun lieu » = France
   * entière). La home laisse le champ vide (placeholder) tant qu'aucun choix n'est fait.
   */
  franceEntiereIfEmpty?: boolean
  /** source : "suggestion" si l'utilisateur a sélectionné une option d'autocomplete, "free_text" sinon (télémétrie moteur de suggestion). */
  onSubmit: (q: string, source: "suggestion" | "free_text") => void
  onLieuChange: (lieu: { label: string; latitude: number; longitude: number; adminArea?: string } | null) => void
  /** Saisie courante du champ métier et son origine (formulaire home : le bouton Rechercher lit la valeur non validée). */
  onQChange?: (q: string, source: "suggestion" | "free_text") => void
  /**
   * Page de résultats : une option métier acceptée (Entrée, clic) — saisie libre ou suggestion —
   * applique la recherche aussitôt, comme le lieu : la page n'a pas de bouton Rechercher. Sans
   * cette prop (home), l'option remplit seulement le champ et referme la liste ; l'usager
   * renseigne le lieu et le type d'offre, puis le bouton lance.
   */
  submitOnSelect?: boolean
  /** "row" : barre desktop ; "column" : panneau mobile ; "responsive" : colonne en xs, rangée en md+ (home). */
  layout?: "row" | "column" | "responsive"
  /**
   * Modales mobiles plein écran : au focus d'un champ, la barre passe en « écran de saisie » —
   * le champ actif reste seul affiché et ses suggestions sont rendues dans le flux dessous
   * (pas de Popper flottant), donc jamais masquées par le clavier virtuel. Suppose un parent
   * en flex column avec une hauteur bornée au viewport visible (SearchMobilePanel).
   */
  inlineSuggestions?: boolean
  /** Champ en cours de saisie (mode inlineSuggestions) — permet au parent de masquer le reste du formulaire. */
  onActiveFieldChange?: (field: "metier" | "lieu" | null) => void
  /** Message d'erreur DSFR sous le champ métier (label + stroke passent en rouge). */
  qError?: string
  /** Message d'erreur DSFR sous le champ lieu. */
  lieuError?: string
}

// `id` : nécessaire pour l'association explicite au champ via aria-labelledby
function FieldLabel({ children, error, id }: { children: ReactNode; error?: boolean; id?: string }) {
  return (
    <Box
      id={id}
      component="label"
      sx={{
        display: "block",
        fontSize: "1rem",
        fontWeight: 700,
        color: error ? fr.colors.decisions.text.default.error.default : fr.colors.decisions.text.default.grey.default,
        mb: fr.spacing("1v"),
      }}
    >
      {children}
    </Box>
  )
}

// `id` : nécessaire pour l'association explicite au champ via aria-describedby (RGAA 11.10)
function FieldError({ children, id }: { children: ReactNode; id?: string }) {
  return (
    <Box
      id={id}
      sx={{ display: "flex", alignItems: "center", gap: fr.spacing("1v"), mt: fr.spacing("1v"), fontSize: "0.75rem", color: fr.colors.decisions.text.default.error.default }}
    >
      <Box component="span" className={fr.cx("fr-icon-error-fill", "fr-icon--sm")} aria-hidden="true" />
      {children}
    </Box>
  )
}

export function SearchBar({
  initialQ = "",
  initialLieuLabel,
  franceEntiereIfEmpty = false,
  onSubmit,
  onLieuChange,
  onQChange,
  submitOnSelect = false,
  layout = "row",
  inlineSuggestions = false,
  onActiveFieldChange,
  qError,
  lieuError,
}: SearchBarProps) {
  const metierLabelId = useId()
  const lieuLabelId = useId()
  const metierErrorId = useId()
  const lieuErrorId = useId()
  const [inputValue, setInputValue] = useState(initialQ)
  const emptyLieuLabel = franceEntiereIfEmpty ? FRANCE_ENTIERE_OPTION.label : ""
  const [lieuInput, setLieuInput] = useState(initialLieuLabel ?? emptyLieuLabel)
  const [lieuValue, setLieuValue] = useState<LieuOption | null>(null)
  // Libellé du lieu réellement APPLIQUÉ à la recherche — source de vérité pour la
  // restauration au blur (le champ ne doit jamais afficher un texte ≠ critère actif).
  const [appliedLieuLabel, setAppliedLieuLabel] = useState(initialLieuLabel ?? emptyLieuLabel)

  // Cache Components (<Activity>) garde ce composant monté (masqué) d'une navigation à l'autre,
  // et useState ne relit initialQ/initialLieuLabel qu'au montage : sans ces effets, retour arrière
  // puis nouvelle recherche depuis la home laisse l'ancienne saisie affichée. Après un
  // onSubmit/onLieuChange local, la prop pointe déjà vers la valeur affichée.
  useEffect(() => {
    setInputValue(initialQ)
  }, [initialQ])
  useEffect(() => {
    // Prop repassée à undefined (« aucun lieu ») : trois origines à distinguer par ce que le
    // champ affichait — la croix l'a vidé (il reste vide, placeholder), l'option « France
    // entière » l'a rempli (on garde), ou l'URL a perdu son lieu (retour navigateur : le champ
    // reflète l'état appliqué, « France entière » sur la page de résultats, vide sur la home).
    const next = (prev: string) => {
      if (initialLieuLabel) return initialLieuLabel
      if (prev === "") return ""
      return isFranceEntiereLabel(prev) ? prev : emptyLieuLabel
    }
    setLieuInput(next)
    setAppliedLieuLabel(next)
  }, [initialLieuLabel, emptyLieuLabel])

  // Saisie métier normalisée (trim) : seuil des 3 caractères, requête et état de chargement
  // raisonnent tous sur la même valeur — « ab » suivi d'un espace ne déclenche pas de suggestions.
  const trimmedInput = inputValue.trim()
  const debouncedInput = useThrottle(trimmedInput, 300)
  const debouncedLieu = useThrottle(lieuInput, 300)

  const metierListbox = useListboxMaxHeight()
  const lieuListbox = useListboxMaxHeight()

  // Champ en cours de saisie de l'écran de saisie mobile — piloté par focus/blur des
  // Autocomplete (les clics sur les options ne blurent pas : MUI garde le focus dans
  // l'input, et blurOnSelect le rend après sélection → retour à la vue formulaire).
  const [activeField, setActiveField] = useState<"metier" | "lieu" | null>(null)
  const changeActiveField = (field: "metier" | "lieu" | null) => {
    if (!inlineSuggestions) return
    setActiveField(field)
    onActiveFieldChange?.(field)
  }

  const isColumn = layout === "column"
  const responsive = layout === "responsive"
  const rowSx = {
    direction: isColumn ? "column" : responsive ? { xs: "column", md: "row" } : "row",
    gap: isColumn ? fr.spacing("4v") : responsive ? { xs: fr.spacing("4v"), md: fr.spacing("3v") } : fr.spacing("3v"),
    align: isColumn ? "stretch" : responsive ? { xs: "stretch", md: "flex-end" } : "flex-end",
    metierFlex: isColumn ? "none" : responsive ? { xs: "none", md: 2 } : 2,
    lieuFlex: isColumn ? "none" : responsive ? { xs: "none", md: "0 0 320px" } : "0 0 320px",
    fieldWidth: isColumn ? "100%" : responsive ? { xs: "100%", md: "auto" } : undefined,
  } as const

  // Écran de saisie : le wrapper du champ actif devient LA colonne flex qui contient label,
  // champ et suggestions inline (rendues par MUI juste après le champ) ; l'autre champ est
  // masqué mais reste monté (il garde son state).
  const activeWrapperSx = { flex: "1 1 auto", minHeight: 0, minWidth: 0, width: "100%", display: "flex", flexDirection: "column" } as const
  const metierWrapperSx = activeField === "metier" ? activeWrapperSx : { flex: rowSx.metierFlex, width: rowSx.fieldWidth, display: activeField === "lieu" ? "none" : undefined }
  const lieuWrapperSx = activeField === "lieu" ? activeWrapperSx : { flex: rowSx.lieuFlex, width: rowSx.fieldWidth, display: activeField === "metier" ? "none" : undefined }

  const { data: suggestionData, isPending: suggestionsPending } = useQuery({
    queryKey: ["/v1/search/suggest", debouncedInput],
    queryFn: ({ signal }) => apiGet("/v1/search/suggest", { querystring: { q: debouncedInput, limit: 8 } }, { signal }),
    enabled: debouncedInput.length >= 3,
    staleTime: 1000 * 60 * 5,
    throwOnError: false,
  })
  const suggestions = suggestionData?.suggestions ?? []

  // Tant que les suggestions de la saisie courante ne sont pas arrivées, seule la ligne
  // « Rechercher » est listée : une option commune avec la liste précédente serait retrouvée par
  // MUI via son libellé, qui déplacerait son index surligné sans mettre à jour le DOM — Entrée
  // accepterait une autre option que celle surlignée à l'écran
  // (useAutocomplete.getPreviousHighlightedOptionIndex, MUI 7.3). La ligne « Rechercher », à
  // l'index 0, est toujours retrouvée à sa place.
  const suggestionsLoading = trimmedInput.length >= 3 && (debouncedInput !== trimmedInput || suggestionsPending)
  const metierOptions: MetierOption[] = trimmedInput
    ? [{ kind: "free_text", value: inputValue }, ...(suggestionsLoading ? [] : suggestions).map((value): MetierOption => ({ kind: "suggestion", value }))]
    : []

  const { data: lieuOptions } = useQuery({
    queryKey: ["lieu-suggestions", debouncedLieu],
    // withAdminAreas : les départements et régions remontent dans les suggestions (index poi).
    queryFn: ({ signal }) => searchAddress(debouncedLieu, undefined, signal, true),
    enabled: debouncedLieu.length >= 2 && !isFranceEntiereLabel(debouncedLieu),
    staleTime: 1000 * 60 * 5,
    throwOnError: false,
  })
  const lieuSuggestions: LieuOption[] = (lieuOptions ?? []).map((item) => ({
    label: item.label,
    latitude: item.value.coordinates[1],
    longitude: item.value.coordinates[0],
    adminArea: item.adminArea,
    displayLabel: item.displayLabel,
  }))

  // Champ vide ou affichant « France entière » : seule cette option est proposée ; en saisie,
  // les suggestions BAN.
  const showsFranceEntiere = isFranceEntiereLabel(lieuInput)
  const lieuDropdownOptions: LieuDropdownOption[] = lieuInput.trim() && !showsFranceEntiere ? lieuSuggestions : [FRANCE_ENTIERE_OPTION]

  // Origine de la saisie métier courante, pour un lancement depuis le champ lieu ou le bouton
  // (une suggestion acceptée puis relancée depuis ailleurs reste une « suggestion »).
  const qSourceRef = useRef<"suggestion" | "free_text">("free_text")
  const handleSubmit = useCallback(
    (value: string, source: "suggestion" | "free_text") => {
      qSourceRef.current = source
      onSubmit(value, source)
    },
    [onSubmit]
  )

  // Entrée, liste ouverte : MUI accepte l'option surlignée (son index interne, pas le DOM), fait
  // preventDefault et onChange décide. Liste fermée : la soumission implicite HTML appelle
  // onSubmit ci-dessous — seul cas où Entrée lance. Pas de gestionnaire clavier maison : c'est le
  // pattern combobox de l'APG tel que le navigateur et MUI l'implémentent.
  const submitFromField = () => {
    // Champ lieu : un texte non validé est résolu comme au blur — suggestion exacte (le parent
    // reçoit le lieu, le lancement attend le prochain Entrée pour lire un état à jour), sinon
    // libellé appliqué restauré.
    if (lieuInput.trim() !== appliedLieuLabel.trim()) {
      const exact = lieuSuggestions.find((option) => normalizeLieu(option.label) === normalizeLieu(lieuInput))
      if (exact) {
        selectLieu(exact)
        return
      }
      setLieuInput(appliedLieuLabel)
    }
    // Écran de saisie mobile : Entrée vaut validation du champ — ferme le clavier virtuel et
    // revient à la vue formulaire (via le blur → changeActiveField).
    if (inlineSuggestions && document.activeElement instanceof HTMLElement) document.activeElement.blur()
    handleSubmit(inputValue, qSourceRef.current)
  }

  const normalizeLieu = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim()

  const selectLieu = (lieu: LieuOption) => {
    setLieuValue(lieu)
    setLieuInput(lieu.label)
    setAppliedLieuLabel(lieu.label)
    onLieuChange(lieu)
  }

  // Sortie du champ lieu sans sélection : le texte tapé n'est pas une valeur (pas de géo sans
  // sélection BAN). Tolérance : s'il correspond exactement à une suggestion, on la sélectionne ;
  // sinon on RESTAURE le libellé du lieu appliqué — jamais de texte fantôme (affiché ≠ appliqué).
  const handleLieuBlur = () => {
    if (lieuInput.trim() === appliedLieuLabel.trim()) return
    const exact = lieuSuggestions.find((option) => normalizeLieu(option.label) === normalizeLieu(lieuInput))
    if (exact) {
      selectLieu(exact)
      return
    }
    setLieuInput(appliedLieuLabel)
  }

  return (
    // Formulaire de recherche (landmark `search`) : Entrée dans un champ passe par la soumission
    // implicite HTML (cf. submitFromField). Elle exige un bouton submit « par défaut » dans le
    // formulaire (deux champs texte la bloquent sinon) : le bouton caché ci-dessous joue ce
    // rôle — le bouton Rechercher visible de la home est un bouton simple hors formulaire, et
    // la page de résultats n'en a pas.
    <Box
      component="form"
      role="search"
      aria-label="Recherche d'offres et de formations"
      noValidate
      onSubmit={(e) => {
        e.preventDefault()
        submitFromField()
      }}
      // Cmd+Entrée (macOS) / Ctrl+Entrée : le navigateur ne fait pas de soumission implicite
      // avec un modificateur — on la déclenche. Après MUI (bulle depuis l'Autocomplete) : s'il a
      // accepté une option il a fait preventDefault, on ne lance pas par-dessus.
      onKeyDown={(e) => {
        if (e.key !== "Enter" || !(e.metaKey || e.ctrlKey) || e.defaultPrevented) return
        e.preventDefault()
        e.currentTarget.requestSubmit()
      }}
      sx={{
        display: "flex",
        flexDirection: rowSx.direction,
        gap: rowSx.gap,
        alignItems: rowSx.align,
        // Écran de saisie : la barre s'étire sur tout l'espace restant du panneau — c'est
        // cette hauteur que les suggestions inline remplissent.
        ...(activeField ? { flex: "1 1 auto", minHeight: 0 } : null),
      }}
    >
      {/* Champ métier */}
      <Box sx={metierWrapperSx}>
        <FieldLabel id={metierLabelId} error={Boolean(qError)}>
          Que recherchez-vous ?
        </FieldLabel>
        <Autocomplete
          freeSolo
          options={metierOptions}
          getOptionLabel={(o) => (typeof o === "string" ? o : o.value)}
          // La 1ʳᵉ option pré-surlignée est la ligne « Rechercher : {saisie} » : Entrée valide la
          // saisie libre telle quelle, sans être détournée vers une suggestion (régression #5503).
          // Pas de `loading`/`loadingText` MUI : ils ne s'affichent qu'à liste vide, or la ligne
          // « Rechercher » est toujours là — le chargement est rendu par renderGroup.
          autoHighlight
          slots={inlineSuggestions ? { popper: InlineSuggestionsContainer } : undefined}
          blurOnSelect={inlineSuggestions}
          onFocus={() => changeActiveField("metier")}
          onBlur={() => changeActiveField(null)}
          // Mode inline : le cap de hauteur du listbox est inutile (cf. INLINE_PAPER_SX), on n'arme
          // pas le hook (listeners visualViewport + setState à chaque resize/scroll du clavier).
          onOpen={inlineSuggestions ? undefined : metierListbox.onOpen}
          onClose={inlineSuggestions ? undefined : metierListbox.onClose}
          inputValue={inputValue}
          onInputChange={(_e, value, reason) => {
            // "reset" est déclenché par la sélection d'une option : c'est onChange qui reflète la
            // suggestion dans le champ (et fixe son origine), pas ce gestionnaire.
            if (reason === "reset") return
            setInputValue(value)
            qSourceRef.current = "free_text"
            onQChange?.(value, "free_text")
            // Champ vidé sur la page de résultats : le critère métier est retiré de la recherche
            // courante (comme la croix du lieu). Jamais sur la home : onSubmit y navigue vers
            // /recherche, onQChange("") suffit.
            if (value === "" && submitOnSelect) handleSubmit("", "free_text")
          }}
          onChange={(_e, value, reason) => {
            // "createOption" = Entrée sans option surlignée (freeSolo) : MUI ne fait pas
            // preventDefault, la soumission implicite qui suit lance la recherche — rien ici
            // (sinon double lancement).
            if (reason !== "selectOption" || !value || typeof value === "string") return
            // Option acceptée (Entrée, clic) : MUI a fait preventDefault, pas de soumission
            // implicite derrière. Saisie libre et suggestion ne diffèrent que par l'origine télémétrie.
            const source = value.kind === "free_text" ? "free_text" : "suggestion"
            // Reflète la sélection dans le champ (onInputChange ignore le reason "reset",
            // le libellé sélectionné ne serait pas affiché sinon).
            setInputValue(value.value)
            qSourceRef.current = source
            onQChange?.(value.value, source)
            if (submitOnSelect) handleSubmit(value.value, source)
          }}
          // key AVANT le spread, et retiré des props MUI : `key` après un spread fait
          // retomber SWC sur createElement — les enfants du li deviennent un tableau
          // non marqué statique et React exige alors un key sur chacun (warning).
          renderOption={({ key: _muiKey, ...optionProps }, option) =>
            option.kind === "free_text" ? (
              // « Rechercher : » n'est affiché que si accepter la ligne lance vraiment
              // (submitOnSelect) ; sur la home elle ne fait que valider la saisie.
              <Box
                component="li"
                key="__free_text__"
                {...optionProps}
                sx={{
                  minHeight: 60,
                  px: "16px !important",
                  display: "flex",
                  alignItems: "center",
                  gap: fr.spacing("2v"),
                  backgroundColor: `${fr.colors.decisions.background.contrast.blueFrance.default} !important`,
                }}
              >
                <Box component="span" className={fr.cx("fr-icon-search-line", "fr-icon--sm")} sx={{ color: fr.colors.decisions.text.mention.grey.default }} aria-hidden="true" />
                <Box>
                  <Box sx={{ fontSize: "1rem", color: fr.colors.decisions.text.default.grey.default }}>
                    {submitOnSelect && <>Rechercher : </>}
                    <Box component="span" sx={{ fontWeight: 700 }}>
                      {option.value}
                    </Box>
                  </Box>
                  <Box sx={{ fontSize: "0.75rem", color: fr.colors.decisions.text.mention.grey.default }}>ou appuyer sur Entrée</Box>
                </Box>
              </Box>
            ) : (
              <Box
                component="li"
                key={option.value}
                {...optionProps}
                sx={{ minHeight: 40, px: "16px !important", fontSize: "1rem", color: fr.colors.decisions.text.default.grey.default }}
              >
                {/* Span unique : le li MUI est en display:flex — des fragments texte séparés y perdent leurs espaces de bord. */}
                <Box component="span">{highlightMatch(option.value, inputValue)}</Box>
              </Box>
            )
          }
          // Deux groupes consécutifs : "" (ligne « Rechercher », sans en-tête) puis "Suggestions".
          groupBy={(option) => (option.kind === "suggestion" ? "Suggestions" : "")}
          renderGroup={(params) => (
            <Box component="li" key={params.key}>
              {params.group && <Box sx={{ px: "16px", lineHeight: "36px", fontSize: "0.75rem", color: fr.colors.decisions.text.mention.grey.default }}>{params.group}</Box>}
              <Box component="ul" sx={{ p: 0, m: 0, listStyle: "none" }}>
                {params.children}
              </Box>
              {/* État de chargement sous la ligne « Rechercher » (remplace le loadingText MUI, cf. Autocomplete). */}
              {!params.group && suggestionsLoading && (
                <Box sx={{ px: "16px", lineHeight: "36px", fontSize: "0.875rem", color: fr.colors.decisions.text.mention.grey.default }} aria-live="polite">
                  Recherche de suggestions…
                </Box>
              )}
            </Box>
          )}
          slotProps={{
            paper: { sx: inlineSuggestions ? INLINE_PAPER_SX : POPPER_PAPER_SX },
            listbox: { sx: inlineSuggestions ? INLINE_LISTBOX_SX : { maxHeight: metierListbox.maxHeight } },
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              inputRef={metierListbox.inputRef}
              placeholder="Recherche par mot clé (métier, formation, entreprise, compétence,...)"
              variant="outlined"
              size="small"
              fullWidth
              sx={fieldSx(Boolean(qError))}
              // Aligné sur la borne API (q max 200) : sans lui, un collage long produit un 400.
              slotProps={{
                htmlInput: {
                  ...params.inputProps,
                  maxLength: 200,
                  // Clavier virtuel : touche « rechercher » (loupe) à la place de « retour ».
                  enterKeyHint: "search",
                  "aria-labelledby": metierLabelId,
                  "aria-describedby": qError ? metierErrorId : undefined,
                  "aria-invalid": Boolean(qError),
                },
              }}
            />
          )}
          noOptionsText="Aucune suggestion"
          filterOptions={(x) => x}
        />
        {qError && <FieldError id={metierErrorId}>{qError}</FieldError>}
      </Box>

      {/* Champ lieu */}
      <Box sx={lieuWrapperSx}>
        <Box sx={{ mb: fr.spacing("1v") }}>
          <FieldLabel id={lieuLabelId} error={Boolean(lieuError)}>
            Lieu
          </FieldLabel>
        </Box>
        <Autocomplete
          freeSolo
          // La 1re option (suggestion ou « France entière ») est pré-surlignée : Entrée la
          // sélectionne au lieu de laisser un texte non validé.
          autoHighlight
          // Ouvre le dropdown au focus : l'option « France entière » est proposée avant toute saisie.
          openOnFocus
          // Le champ affiche « France entière » : le focus sélectionne le texte pour qu'une
          // saisie le remplace directement (sinon l'usager doit l'effacer à la main).
          selectOnFocus={showsFranceEntiere}
          // Pattern APG : une option surlignée est acceptée sans lancer (l'usager enchaîne
          // souvent sur le métier) ; liste fermée, Entrée lance (soumission implicite →
          // submitFromField, qui résout un éventuel texte non validé).
          options={lieuDropdownOptions}
          // Le reset post-sélection de MUI réécrit l'input avec getOptionLabel : pour
          // « France entière » c'est son libellé qui doit s'afficher (cf. onChange).
          getOptionLabel={(o) => (typeof o === "string" ? o : o.label)}
          isOptionEqualToValue={(o, v) => {
            if ("kind" in o) return false
            return typeof v === "string" ? o.label === v : !("kind" in v) && lieuOptionKey(o) === lieuOptionKey(v)
          }}
          slots={inlineSuggestions ? { popper: InlineSuggestionsContainer } : undefined}
          blurOnSelect={inlineSuggestions}
          // Mode inline : cap listbox inutile — hook non armé (cf. champ métier).
          onOpen={inlineSuggestions ? undefined : lieuListbox.onOpen}
          onClose={inlineSuggestions ? undefined : lieuListbox.onClose}
          inputValue={lieuInput}
          value={lieuValue}
          onFocus={() => changeActiveField("lieu")}
          onBlur={() => {
            changeActiveField(null)
            handleLieuBlur()
          }}
          onInputChange={(_e, value, reason) => {
            setLieuInput(value)
            // "clear" = clic sur la croix MUI — on retire le lieu des params
            // "reset" peut se déclencher à l'hydration, on l'ignore volontairement
            if (reason === "clear") {
              setLieuValue(null)
              setAppliedLieuLabel("")
              onLieuChange(null)
            }
          }}
          onChange={(_e, value) => {
            if (!value || typeof value === "string") return
            // « France entière » : retire le lieu et affiche le libellé dans le champ. La croix
            // MUI (reason "clear") retire aussi le lieu mais laisse le champ vide (placeholder).
            if ("kind" in value) {
              setLieuValue(null)
              setLieuInput(FRANCE_ENTIERE_OPTION.label)
              setAppliedLieuLabel(FRANCE_ENTIERE_OPTION.label)
              onLieuChange(null)
              return
            }
            selectLieu(value)
          }}
          // key avant le spread et hors des props MUI — même raison que le champ métier.
          renderOption={({ key: _muiKey, ...optionProps }, option, { index }) =>
            "kind" in option ? (
              <Box
                component="li"
                key="__france_entiere__"
                {...optionProps}
                sx={{ minHeight: 60, px: "16px !important", display: "flex", alignItems: "center", gap: fr.spacing("2v") }}
              >
                <Box component="span" className={fr.cx("fr-icon-map-pin-2-line", "fr-icon--sm")} sx={{ color: fr.colors.decisions.text.mention.grey.default }} aria-hidden="true" />
                <Box>
                  <Box sx={{ fontSize: "1rem", color: fr.colors.decisions.text.default.grey.default }}>France entière</Box>
                  <Box sx={{ fontSize: "0.75rem", color: fr.colors.decisions.text.mention.grey.default }}>ou appuyer sur Entrée</Box>
                </Box>
              </Box>
            ) : (
              <Box component="li" key={lieuOptionKey(option)} {...optionProps} sx={{ minHeight: 40, px: "16px !important", display: "block !important" }}>
                {/* Libellé de liste (« Bretagne (région) ») distinct du libellé appliqué au champ et à l'URL. */}
                <Box sx={{ fontSize: "1rem", color: fr.colors.decisions.text.default.grey.default }}>{highlightMatch(option.displayLabel ?? option.label, lieuInput)}</Box>
                {index === 0 && <Box sx={{ fontSize: "0.75rem", color: fr.colors.decisions.text.mention.grey.default }}>ou appuyer sur Entrée</Box>}
              </Box>
            )
          }
          slotProps={{
            paper: { sx: inlineSuggestions ? INLINE_PAPER_SX : POPPER_PAPER_SX },
            listbox: { sx: inlineSuggestions ? INLINE_LISTBOX_SX : { maxHeight: lieuListbox.maxHeight } },
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              inputRef={lieuListbox.inputRef}
              placeholder="Ville, département ou région"
              variant="outlined"
              size="small"
              fullWidth
              sx={fieldSx(Boolean(lieuError))}
              slotProps={{
                htmlInput: {
                  ...params.inputProps,
                  enterKeyHint: "search",
                  "aria-labelledby": lieuLabelId,
                  "aria-describedby": lieuError ? lieuErrorId : undefined,
                  "aria-invalid": Boolean(lieuError),
                },
              }}
            />
          )}
          noOptionsText="Aucune suggestion"
          filterOptions={(x) => x}
        />
        {lieuError && <FieldError id={lieuErrorId}>{lieuError}</FieldError>}
      </Box>
      {/* Bouton submit par défaut du formulaire (soumission implicite sur Entrée). `hidden` : hors
          rendu et hors arbre d'accessibilité, non focusable — le lancement visible est le bouton
          Rechercher de la home ou Entrée. */}
      <button type="submit" hidden tabIndex={-1}>
        Rechercher
      </button>
    </Box>
  )
}
