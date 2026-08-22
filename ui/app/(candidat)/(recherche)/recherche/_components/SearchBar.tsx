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

// Champs du design « Nouvelle recherche » : blancs, 48px, stroke 1px, radius 4 — plus de fond
// gris contrasté ni de bordure basse ni d'icône dans le champ.
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

// Panneau flottant des autocompletes (ombre + radius du design).
const POPPER_PAPER_SX = { mt: "4px", borderRadius: "4px", py: "8px", boxShadow: "0 6px 18px rgba(0,0,18,0.16)" }

// Mode « écran de saisie » (inlineSuggestions) : même design de liste que le dropdown
// (radius, ombre, padding, rendu des options), mais le paper se borne à l'espace restant
// sous le champ (le calc retranche son mt) et la liste scrolle à l'intérieur — le cap
// 40vh de MUI saute, la hauteur vient du flex de l'écran de saisie.
const INLINE_PAPER_SX = { ...POPPER_PAPER_SX, maxHeight: "calc(100% - 4px)", display: "flex", flexDirection: "column" } as const
// overscroll contain : arrivé en butée, le scroll de la liste ne doit pas chaîner vers la
// page derrière la modale (surtout iOS).
const INLINE_LISTBOX_SX = { maxHeight: "none", minHeight: 0, overflowY: "auto", overscrollBehavior: "contain" } as const

/**
 * Slot popper du mode inlineSuggestions : à la place de la couche flottante popper.js, MUI
 * rend ce conteneur DANS le flux, juste sous le champ — il occupe l'espace restant de
 * l'écran de saisie (flex) et le clavier virtuel ne peut plus recouvrir la liste. Les props
 * de positionnement (anchorEl, placement, style de largeur…) sont volontairement ignorées.
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

type LieuOption = { label: string; latitude: number; longitude: number }

// Option « France entière » du champ lieu : proposée quand le champ est vide (Entrée la
// sélectionne — autoHighlight), elle retire le lieu de la recherche. Le placeholder
// « France entière » du champ vide reflète ensuite l'état appliqué.
const FRANCE_ENTIERE_OPTION = { kind: "france_entiere", label: "France entière" } as const
type LieuDropdownOption = LieuOption | typeof FRANCE_ENTIERE_OPTION

// Option du dropdown métier : la 1ʳᵉ ligne relance la recherche en texte libre, les
// suivantes sont les suggestions de l'endpoint suggest.
type MetierOption = { kind: "free_text"; value: string } | { kind: "suggestion"; value: string }

interface SearchBarProps {
  initialQ?: string
  initialLieuLabel?: string
  /** source : "suggestion" si l'utilisateur a sélectionné une option d'autocomplete, "free_text" sinon (télémétrie moteur de suggestion). */
  onSubmit: (q: string, source: "suggestion" | "free_text") => void
  onLieuChange: (lieu: { label: string; latitude: number; longitude: number } | null) => void
  /** Saisie courante du champ métier (formulaire home : le bouton Rechercher lit la valeur non validée). */
  onQChange?: (q: string) => void
  /** "row" : barre desktop ; "column" : panneau mobile ; "responsive" : colonne en xs, rangée en md+ (home). */
  layout?: "row" | "column" | "responsive"
  /**
   * Modales mobiles plein écran : au focus d'un champ, la barre passe en « écran de saisie » —
   * le champ actif reste seul affiché et ses suggestions sont rendues dans le flux dessous
   * (plus de Popper flottant), donc jamais masquées par le clavier virtuel. Suppose un parent
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
  onSubmit,
  onLieuChange,
  onQChange,
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
  const [lieuInput, setLieuInput] = useState(initialLieuLabel ?? "")
  const [lieuValue, setLieuValue] = useState<LieuOption | null>(null)
  // Libellé du lieu réellement APPLIQUÉ à la recherche — source de vérité pour la
  // restauration au blur (le champ ne doit jamais afficher un texte ≠ critère actif).
  const [appliedLieuLabel, setAppliedLieuLabel] = useState(initialLieuLabel ?? "")

  // Cache Components (<Activity>) garde l'instance de ce composant montée (masquée, pas
  // démontée) d'une navigation à l'autre — sans ceci, revenir en arrière puis relancer une
  // recherche depuis la home laisse le champ affiché sur l'ancienne saisie alors que l'URL
  // et les résultats reflètent déjà la nouvelle (initialQ/initialLieuLabel ne sont relus
  // qu'au montage via useState). Ne s'exécute que quand la prop change réellement — un
  // onSubmit/onLieuChange local la fait déjà pointer vers la valeur déjà affichée.
  useEffect(() => {
    setInputValue(initialQ)
  }, [initialQ])
  useEffect(() => {
    setLieuInput(initialLieuLabel ?? "")
    setAppliedLieuLabel(initialLieuLabel ?? "")
  }, [initialLieuLabel])

  const debouncedInput = useThrottle(inputValue, 300)
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
  // Valeurs sx par layout : "responsive" = colonne en xs, rangée en md+ (formulaire home).
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
  // masqué mais reste monté (il garde son state). Hors écran de saisie, wrappers inchangés.
  const activeWrapperSx = { flex: "1 1 auto", minHeight: 0, minWidth: 0, width: "100%", display: "flex", flexDirection: "column" } as const
  const metierWrapperSx = activeField === "metier" ? activeWrapperSx : { flex: rowSx.metierFlex, width: rowSx.fieldWidth, display: activeField === "lieu" ? "none" : undefined }
  const lieuWrapperSx = activeField === "lieu" ? activeWrapperSx : { flex: rowSx.lieuFlex, width: rowSx.fieldWidth, display: activeField === "metier" ? "none" : undefined }

  // Suggestions pour le champ métier — autocomplétion par préfixe (endpoint dédié, min 3 caractères)
  const { data: suggestionData } = useQuery({
    queryKey: ["/v1/search/suggest", debouncedInput],
    queryFn: ({ signal }) => apiGet("/v1/search/suggest", { querystring: { q: debouncedInput, limit: 8 } }, { signal }),
    enabled: debouncedInput.length >= 3,
    staleTime: 1000 * 60 * 5,
    throwOnError: false,
  })
  const suggestions = suggestionData?.suggestions ?? []

  // Options du dropdown : ligne d'action « Rechercher : {saisie} » + groupe Suggestions.
  const metierOptions: MetierOption[] = inputValue.trim()
    ? [{ kind: "free_text", value: inputValue }, ...suggestions.map((s): MetierOption => ({ kind: "suggestion", value: s }))]
    : []

  // Suggestions pour le champ lieu
  const { data: lieuOptions } = useQuery({
    queryKey: ["lieu-suggestions", debouncedLieu],
    queryFn: ({ signal }) => searchAddress(debouncedLieu, undefined, signal),
    enabled: debouncedLieu.length >= 2,
    staleTime: 1000 * 60 * 5,
    throwOnError: false,
  })
  const lieuSuggestions: LieuOption[] = (lieuOptions ?? []).map((item) => ({
    label: item.label,
    latitude: item.value.coordinates[1],
    longitude: item.value.coordinates[0],
  }))

  // Champ vide : seule l'option « France entière » est proposée ; en saisie, les suggestions
  // BAN (Entrée sélectionne la 1ʳᵉ dans les deux cas, cf. autoHighlight).
  const lieuDropdownOptions: LieuDropdownOption[] = lieuInput.trim() ? lieuSuggestions : [FRANCE_ENTIERE_OPTION]

  const handleSubmit = useCallback(
    (value: string, source: "suggestion" | "free_text") => {
      onSubmit(value, source)
    },
    [onSubmit]
  )

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
    <Box
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
          slots={inlineSuggestions ? { popper: InlineSuggestionsContainer } : undefined}
          blurOnSelect={inlineSuggestions}
          onFocus={() => changeActiveField("metier")}
          onBlur={() => changeActiveField(null)}
          // Mode inline : le cap de hauteur du listbox ne sert plus (la hauteur vient du
          // flex de l'écran de saisie) — ne pas armer le hook (listeners visualViewport +
          // setState à chaque resize/scroll pendant l'animation du clavier).
          onOpen={inlineSuggestions ? undefined : metierListbox.onOpen}
          onClose={inlineSuggestions ? undefined : metierListbox.onClose}
          inputValue={inputValue}
          onInputChange={(_e, value, reason) => {
            // "reset" est déclenché par la sélection d'une option — ne pas écraser la saisie
            // avec le libellé de la ligne « Rechercher : … ».
            if (reason === "reset") return
            setInputValue(value)
            onQChange?.(value)
            if (value === "") handleSubmit("", "free_text")
          }}
          onChange={(_e, value) => {
            if (!value) return
            if (typeof value === "string") {
              handleSubmit(value, "free_text")
              return
            }
            // Reflète la sélection dans le champ (onInputChange ignore le reason "reset",
            // le libellé sélectionné ne serait pas affiché sinon).
            setInputValue(value.value)
            onQChange?.(value.value)
            handleSubmit(value.value, value.kind === "suggestion" ? "suggestion" : "free_text")
          }}
          // key AVANT le spread, et retiré des props MUI : `key` après un spread fait
          // retomber SWC sur createElement — les enfants du li deviennent un tableau
          // non marqué statique et React exige alors un key sur chacun (warning).
          renderOption={({ key: _muiKey, ...optionProps }, option) =>
            option.kind === "free_text" ? (
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
                    Rechercher :{" "}
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
          groupBy={(option) => (option.kind === "suggestion" ? "Suggestions" : "")}
          renderGroup={(params) => (
            <Box component="li" key={params.key}>
              {params.group && <Box sx={{ px: "16px", lineHeight: "36px", fontSize: "0.75rem", color: fr.colors.decisions.text.mention.grey.default }}>{params.group}</Box>}
              <Box component="ul" sx={{ p: 0, m: 0, listStyle: "none" }}>
                {params.children}
              </Box>
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
                  "aria-labelledby": metierLabelId,
                  "aria-describedby": qError ? metierErrorId : undefined,
                  "aria-invalid": Boolean(qError),
                },
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSubmit(inputValue, "free_text")
                  // Écran de saisie : Entrée vaut validation du champ — ferme le clavier
                  // virtuel et revient à la vue formulaire (via le blur → changeActiveField).
                  if (inlineSuggestions) (e.target as HTMLElement).blur()
                }
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
          // autoHighlight : la 1re suggestion est pré-surlignée → Entrée la sélectionne
          // (au lieu de laisser un texte non validé). Vaut aussi pour « France entière »
          // (seule option quand le champ est vide).
          autoHighlight
          // Ouvre le dropdown au focus : l'option « France entière » est proposée avant toute saisie.
          openOnFocus
          options={lieuDropdownOptions}
          // Libellé vide pour « France entière » : le reset post-sélection de MUI réécrit
          // l'input avec getOptionLabel — le champ doit rester vide (placeholder visible).
          getOptionLabel={(o) => (typeof o === "string" ? o : "kind" in o ? "" : o.label)}
          isOptionEqualToValue={(o, v) => {
            if ("kind" in o) return false
            return typeof v === "string" ? o.label === v : !("kind" in v) && o.label === v.label
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
            // « France entière » : retire le lieu (équivalent de la croix, au clavier).
            if ("kind" in value) {
              setLieuValue(null)
              setLieuInput("")
              setAppliedLieuLabel("")
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
              <Box component="li" key={option.label} {...optionProps} sx={{ minHeight: 40, px: "16px !important", display: "block !important" }}>
                <Box sx={{ fontSize: "1rem", color: fr.colors.decisions.text.default.grey.default }}>{highlightMatch(option.label, lieuInput)}</Box>
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
              placeholder="France entière"
              variant="outlined"
              size="small"
              fullWidth
              sx={fieldSx(Boolean(lieuError))}
              slotProps={{
                htmlInput: {
                  ...params.inputProps,
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
    </Box>
  )
}
