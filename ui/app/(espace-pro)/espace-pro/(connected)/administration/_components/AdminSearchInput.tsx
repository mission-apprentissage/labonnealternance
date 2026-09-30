import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import Input from "@codegouvfr/react-dsfr/Input"
import { Box } from "@mui/material"
import { useRef, useState } from "react"

const MIN_SEARCH_LENGTH = 2

const validateMinLength = (search: string) => (search.length < MIN_SEARCH_LENGTH ? `Saisissez au moins ${MIN_SEARCH_LENGTH} caractères` : null)

/**
 * La saisie reste locale au champ : remonter chaque frappe re-rendrait toute la liste parente.
 * Par défaut, toute recherche de moins de MIN_SEARCH_LENGTH caractères, vide comprise, est en erreur ;
 * `validate` et `hintText` remplacent cette règle et son aide pour un format précis.
 * `onReset` : ajoute un bouton qui vide le champ et laisse le parent rétablir l'affichage d'origine.
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

  const submit = () => {
    const search = value.trim()
    const searchError = validate(search)
    if (searchError) {
      setError(searchError)
      inputRef.current?.focus()
      return
    }
    setError(null)
    onSearch(search)
  }

  const reset = () => {
    setValue("")
    setError(null)
    onReset()
  }

  // Sous-grille : label, champ et message du fr-input-group occupent les lignes 1 à 3 de la grille,
  // les boutons se placent sur la ligne du champ (desktop) ou dessous (mobile), le message reste limité à la colonne du champ
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "minmax(0, 1fr)", md: `minmax(0, ${inputWidth}) auto` },
        justifyContent: "start",
        columnGap: fr.spacing("2v"),
        "& > .fr-input-group": { gridColumn: 1, gridRow: "1 / 4", display: "grid", gridTemplateRows: "subgrid" },
        "& .fr-input": { mb: fr.spacing("3v") },
        // les 3v de marge du champ s'ajoutent à la marge haute DSFR du message d'erreur
        "& .fr-messages-group > .fr-message": { mt: fr.spacing("1v"), mb: fr.spacing("3v") },
      }}
    >
      <Input
        className={fr.cx("fr-mb-0")}
        label={`${label} (obligatoire)`}
        hintText={hintText}
        state={error ? "error" : "default"}
        stateRelatedMessage={error}
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
          display: "flex",
          flexWrap: "wrap",
          columnGap: fr.spacing("2v"),
          "& > .fr-btn": { mb: fr.spacing("3v") },
        }}
      >
        <Button iconId="fr-icon-search-line" priority="primary" onClick={submit}>
          Rechercher
        </Button>
        {onReset && (
          <Button iconId="fr-icon-refresh-line" priority="secondary" onClick={reset} style={{ whiteSpace: "nowrap" }}>
            Réinitialiser la recherche
          </Button>
        )}
      </Box>
    </Box>
  )
}
