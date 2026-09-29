import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import Input from "@codegouvfr/react-dsfr/Input"
import { useRef, useState } from "react"

const MIN_SEARCH_LENGTH = 2

const validateMinLength = (search: string) => (search.length < MIN_SEARCH_LENGTH ? `Saisissez au moins ${MIN_SEARCH_LENGTH} caractères` : null)

/**
 * La saisie reste locale au champ : remonter chaque frappe re-rendrait toute la liste parente.
 * Par défaut, toute recherche de moins de MIN_SEARCH_LENGTH caractères, vide comprise, est en erreur ;
 * `validate` et `hintText` remplacent cette règle et son aide pour un format précis.
 * `onReset` : pour une liste qui s'affiche aussi sans recherche, ajoute un bouton qui rétablit la liste d'origine.
 */
export function AdminSearchInput({
  label,
  placeholder,
  onSearch,
  onReset,
  validate = validateMinLength,
  hintText = `Au moins ${MIN_SEARCH_LENGTH} caractères`,
  minWidth = "360px",
}: {
  label: string
  placeholder: string
  onSearch: (value: string) => void
  onReset?: () => void
  validate?: (search: string) => string | null
  hintText?: string
  minWidth?: string
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

  return (
    <Input
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
        style: { minWidth },
      }}
      addon={
        <>
          <Button iconId="fr-icon-search-line" priority="primary" onClick={submit}>
            Rechercher
          </Button>
          {onReset && (
            <Button iconId="fr-icon-refresh-line" priority="secondary" onClick={reset} className={fr.cx("fr-ml-2w")} style={{ whiteSpace: "nowrap" }}>
              Réinitialiser la recherche
            </Button>
          )}
        </>
      }
    />
  )
}
