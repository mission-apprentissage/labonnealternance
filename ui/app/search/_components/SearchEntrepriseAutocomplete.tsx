"use client"

import { fr } from "@codegouvfr/react-dsfr"
import { Box } from "@mui/material"
import { useCombobox } from "downshift"
import { useEffect, useMemo, useRef, useState } from "react"

interface SearchEntrepriseAutocompleteProps {
  /** Liste des organismes disponibles (clés de la facette organization_name). */
  options: string[]
  value?: string
  onChange: (value: string | null) => void
  /** Affichage pleine largeur (panneau mobile). */
  fullWidth?: boolean
  /** Si fourni, libellé affiché au-dessus du champ (remplace le label flottant). */
  topLabel?: string
}

/**
 * Filtre mono-valeur sur `organization_name` (opérateur equals côté API).
 * Champ DSFR + liste de suggestions filtrée par sous-chaîne et triée alpha.
 */
export function SearchEntrepriseAutocomplete({ options, value, onChange, fullWidth = false, topLabel }: SearchEntrepriseAutocompleteProps) {
  const [inputValue, setInputValue] = useState("")
  const active = Boolean(value)

  const items = useMemo(() => {
    const query = inputValue.trim().toLowerCase()
    return [...options]
      .sort((a, b) => a.localeCompare(b, "fr"))
      .filter((o) => o.toLowerCase().includes(query))
      .slice(0, 100)
  }, [options, inputValue])

  // `selectedItem` volontairement NON contrôlé : si on le synchronisait sur `value`,
  // un effacement externe (tag de filtre actif, croix) ferait passer selectedItem à
  // null et downshift redonnerait le focus à l'input. La sélection est captée via le
  // onClick de l'item à la place.
  const { isOpen, getMenuProps, getInputProps, getItemProps, highlightedIndex, openMenu, closeMenu } = useCombobox<string>({
    items,
    inputValue,
    onInputValueChange: ({ inputValue: next }) => setInputValue(next ?? ""),
    itemToString: (item) => item ?? "",
  })

  function handleSelect(item: string) {
    onChange(item)
    setInputValue("")
    closeMenu()
  }

  // Distingue un focus *réel* (pointeur / clavier) d'un focus programmatique
  // (fallback navigateur quand un tag de filtre focalisé est démonté). Seul un
  // focus réel ouvre le menu ; un focus programmatique est immédiatement relâché.
  const userIntentRef = useRef(false)
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Tab") userIntentRef.current = true
    }
    document.addEventListener("keydown", onKeyDown, true)
    return () => document.removeEventListener("keydown", onKeyDown, true)
  }, [])

  return (
    <Box sx={{ position: "relative", display: fullWidth ? "block" : "inline-block", width: fullWidth ? "100%" : "auto" }}>
      {topLabel ? (
        <Box component="span" sx={{ display: "block", fontSize: "0.75rem", fontWeight: 500, color: fr.colors.decisions.text.mention.grey.default, mb: fr.spacing("1v") }}>
          {topLabel}
        </Box>
      ) : (
        active && (
          <Box
            component="span"
            sx={{
              position: "absolute",
              top: -9,
              left: 8,
              px: "4px",
              backgroundColor: fr.colors.decisions.background.default.grey.default,
              fontSize: "0.6875rem",
              fontWeight: 500,
              color: fr.colors.decisions.text.actionHigh.blueFrance.default,
              zIndex: 1,
            }}
          >
            Entreprise
          </Box>
        )
      )}

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          height: 40,
          minWidth: fullWidth ? "100%" : 190,
          width: fullWidth ? "100%" : undefined,
          pl: fr.spacing("2v"),
          pr: fr.spacing("1v"),
          backgroundColor: active ? fr.colors.decisions.background.contrast.info.default : fr.colors.decisions.background.default.grey.default,
          borderBottom: `2px solid ${active ? fr.colors.decisions.border.actionHigh.blueFrance.default : fr.colors.decisions.border.plain.grey.default}`,
          borderRadius: "4px 4px 0 0",
          color: active ? fr.colors.decisions.text.actionHigh.blueFrance.default : fr.colors.decisions.text.mention.grey.default,
        }}
      >
        <Box component="span" className={fr.cx("fr-icon-building-line", "fr-icon--sm")} aria-hidden="true" sx={{ flex: "0 0 auto" }} />
        <Box
          component="input"
          {...getInputProps({
            placeholder: "Entreprise",
            value: isOpen ? inputValue : (value ?? ""),
            onPointerDown: () => {
              userIntentRef.current = true
            },
            onFocus: (e) => {
              if (!userIntentRef.current) {
                // Focus non sollicité par l'utilisateur → on le relâche.
                e.target.blur()
                return
              }
              userIntentRef.current = false
              setInputValue("")
              openMenu()
            },
            onBlur: () => {
              userIntentRef.current = false
            },
          })}
          sx={{
            flex: "1 1 auto",
            minWidth: 0,
            height: "100%",
            border: "none",
            background: "transparent",
            px: fr.spacing("1v"),
            fontFamily: "inherit",
            fontSize: "0.875rem",
            color: active ? fr.colors.decisions.text.actionHigh.blueFrance.default : fr.colors.decisions.text.default.grey.default,
            fontWeight: active ? 500 : 400,
            "&:focus": { outline: "none" },
            "&::placeholder": { color: fr.colors.decisions.text.mention.grey.default, fontWeight: 400 },
          }}
        />
        {active && (
          <Box
            component="button"
            type="button"
            aria-label="Effacer l'entreprise"
            onMouseDown={(e: React.MouseEvent) => {
              e.preventDefault()
              onChange(null)
              setInputValue("")
            }}
            sx={{
              flex: "0 0 auto",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 24,
              height: 24,
              border: "none",
              background: "none",
              cursor: "pointer",
              color: fr.colors.decisions.text.actionHigh.blueFrance.default,
              borderRadius: "50%",
            }}
          >
            <Box component="span" className={fr.cx("fr-icon-close-line", "fr-icon--sm")} aria-hidden="true" />
          </Box>
        )}
      </Box>

      <Box
        component="ul"
        {...getMenuProps()}
        sx={{
          listStyle: "none",
          margin: 0,
          padding: isOpen ? fr.spacing("1v") : 0,
          position: "absolute",
          top: "calc(100% + 6px)",
          left: 0,
          zIndex: 1300,
          minWidth: fullWidth ? "100%" : 260,
          width: fullWidth ? "100%" : undefined,
          maxHeight: 340,
          overflowY: "auto",
          background: fr.colors.decisions.background.default.grey.default,
          border: isOpen ? `1px solid ${fr.colors.decisions.border.default.grey.default}` : "none",
          borderRadius: "4px",
          boxShadow: isOpen ? "0 2px 6px rgba(0,0,0,0.15)" : "none",
        }}
      >
        {isOpen && items.length === 0 && (
          <Box component="li" sx={{ padding: `${fr.spacing("2v")} ${fr.spacing("2v")}`, fontSize: "0.875rem", color: fr.colors.decisions.text.mention.grey.default }}>
            Aucune entreprise
          </Box>
        )}
        {isOpen &&
          items.map((item, index) => (
            <Box
              component="li"
              key={item}
              {...getItemProps({ item, index, onClick: () => handleSelect(item) })}
              sx={{
                padding: `${fr.spacing("2v")} ${fr.spacing("2v")}`,
                fontSize: "0.875rem",
                borderRadius: "4px",
                cursor: "pointer",
                color: item === value ? fr.colors.decisions.text.actionHigh.blueFrance.default : fr.colors.decisions.text.default.grey.default,
                fontWeight: item === value ? 500 : 400,
                backgroundColor:
                  highlightedIndex === index
                    ? fr.colors.decisions.background.alt.grey.hover
                    : item === value
                      ? fr.colors.decisions.background.contrast.info.default
                      : "transparent",
              }}
            >
              {item}
            </Box>
          ))}
      </Box>
    </Box>
  )
}
