import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import Input from "@codegouvfr/react-dsfr/Input"
import { Box } from "@mui/material"
import { useRef, useState } from "react"

import { MIN_SEARCH_LENGTH, validateMinLength } from "../_utils/admin-search-validation"
import { SearchClearButton, searchClearButtonSx } from "./SearchClearButton"

/**
 * La saisie reste locale au champ : remonter chaque frappe re-rendrait toute la liste parente.
 * Par défaut, toute recherche de moins de MIN_SEARCH_LENGTH caractères, vide comprise, est en erreur ;
 * `validate` et `hintText` remplacent cette règle et son aide pour un format précis.
 * `onReset` : ajoute dans le champ une croix qui le vide et laisse le parent rétablir l'affichage d'origine.
 */
export function AdminSearchInput({
  label,
  placeholder,
  onSearch,
  onReset,
  validate = validateMinLength,
  hintText = `Au moins ${MIN_SEARCH_LENGTH} caractères`,
  inputWidth = "360px",
}: {
  label: string
  placeholder: string
  onSearch: (value: string) => void
  onReset?: () => void
  validate?: (search: string) => string | null
  hintText?: string
  inputWidth?: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [value, setValue] = useState("")
  const [error, setError] = useState<string | null>(null)
  // La croix reste affichée après une recherche lancée, même champ vidé à la main, tant que la réinitialisation n'a pas eu lieu
  const [hasSearched, setHasSearched] = useState(false)

  const submit = () => {
    const search = value.trim()
    const searchError = validate(search)
    if (searchError) {
      setError(searchError)
      inputRef.current?.focus()
      return
    }
    setError(null)
    setHasSearched(true)
    onSearch(search)
  }

  const reset = () => {
    setValue("")
    setError(null)
    setHasSearched(false)
    onReset?.()
    // la croix disparaît : le focus resterait sur un bouton démonté
    inputRef.current?.focus()
  }

  const clearAction = value !== "" || hasSearched ? <SearchClearButton onClick={reset} /> : null

  // Sous-grille : label, champ et message du fr-input-group occupent les lignes 1 à 3 de la grille,
  // le bouton se place sur la ligne du champ (desktop) ou dessous (mobile), le message reste limité à la colonne du champ
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "minmax(0, 1fr)", md: `minmax(0, ${inputWidth}) auto` },
        justifyContent: "start",
        columnGap: fr.spacing("2v"),
        "& > .fr-input-group": { gridColumn: 1, gridRow: "1 / 4", display: "grid", gridTemplateRows: "subgrid" },
        "& > .fr-input-group > .fr-input, & > .fr-input-group > .fr-input-wrap": { mb: fr.spacing("3v") },
        // les 3v de marge du champ s'ajoutent à la marge haute DSFR du message d'erreur
        "& .fr-messages-group > .fr-message": { mt: fr.spacing("1v"), mb: fr.spacing("3v") },
        ...searchClearButtonSx,
      }}
    >
      <Input
        className={fr.cx("fr-mb-0")}
        label={`${label} (obligatoire)`}
        hintText={hintText}
        state={error ? "error" : "default"}
        stateRelatedMessage={error}
        action={onReset ? clearAction : undefined}
        nativeInputProps={{
          ref: inputRef,
          value,
          placeholder,
          required: true,
          onChange: (e) => setValue(e.target.value),
          onKeyDown: (e) => {
            if (e.key === "Enter") submit()
          },
          "aria-invalid": Boolean(error),
        }}
      />
      <Box
        sx={{
          gridColumn: { xs: 1, md: 2 },
          gridRow: { xs: 4, md: 2 },
          alignSelf: "end",
          "& > .fr-btn": { mb: fr.spacing("3v") },
        }}
      >
        <Button iconId="fr-icon-search-line" priority="primary" onClick={submit}>
          Rechercher
        </Button>
      </Box>
    </Box>
  )
}
