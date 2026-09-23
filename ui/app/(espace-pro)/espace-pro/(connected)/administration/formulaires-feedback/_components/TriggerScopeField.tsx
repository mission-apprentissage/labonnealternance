"use client"

import { fr } from "@codegouvfr/react-dsfr"
import Input from "@codegouvfr/react-dsfr/Input"
import Tag from "@codegouvfr/react-dsfr/Tag"
import { Box, Typography } from "@mui/material"
import { useCombobox } from "downshift"
import { useField } from "formik"
import { useEffect, useRef, useState } from "react"
import { UI_ROUTE_PATTERNS } from "shared/constants/ui-routes"
import { matchesKnownUiRoute } from "shared/utils/ui-routes.utils"

const FIELD_NAME = "trigger.scope"
const MAX_SUGGESTIONS = 50

/**
 * Saisie des chemins de déclenchement : autocomplétion sur les chemins réellement exposés par
 * `ui/app` (voir `shared/src/constants/ui-routes.ts`), les chemins retenus s'affichant en étiquettes.
 *
 * Un chemin qui ne correspond à aucune page est refusé : le widget n'y serait jamais rendu et
 * l'erreur ne se verrait qu'en production. La saisie libre reste possible pour les motifs que la
 * liste ne contient pas tels quels — `/guide-alternant/*` couvre toute une rubrique.
 *
 * Les lecteurs d'écran ne perçoivent pas l'apparition ni la disparition d'une étiquette : chaque
 * ajout, refus et retrait est annoncé dans une région `aria-live`, et le bouton de retrait porte
 * le chemin concerné dans son libellé (RGAA 7.4, 11.10).
 */
export function TriggerScopeField() {
  const [field, , helpers] = useField<string[]>(FIELD_NAME)
  const [inputError, setInputError] = useState<string | null>(null)
  const [announcement, setAnnouncement] = useState("")

  const paths = field.value ?? []

  // Formik ne propose pas de mise à jour fonctionnelle : deux mutations émises dans un même batch
  // React liraient toutes deux la valeur d'avant rendu, et la seconde écraserait la première.
  // La ref, écrite au moment de la mutation, garde l'enchaînement correct.
  const pathsRef = useRef(paths)
  useEffect(() => {
    pathsRef.current = field.value ?? []
  }, [field.value])

  const commitPaths = (next: string[]) => {
    pathsRef.current = next
    helpers.setValue(next)
  }

  // Les messages de Zod ne disent pas *quel* chemin est fautif : on nomme les coupables. Affiché
  // sans attendre une interaction, pour qu'un formulaire enregistré avant l'arrivée de ce contrôle
  // (ou ciblant une page supprimée depuis) signale tout de suite ce qu'il y a à corriger.
  const invalidPaths = paths.filter((path) => !matchesKnownUiRoute(path))
  const storedError = invalidPaths.length ? `${invalidPaths.join(", ")} ne correspond${invalidPaths.length > 1 ? "ent" : ""} à aucune page du site` : undefined
  const error = inputError ?? storedError

  const addPath = (candidate: string) => {
    const path = candidate.trim()
    if (!path) return

    if (pathsRef.current.includes(path)) {
      setInputError(`Le chemin ${path} est déjà dans la liste`)
      setAnnouncement(`Le chemin ${path} est déjà dans la liste`)
      return
    }
    if (!matchesKnownUiRoute(path)) {
      const message = `${path} ne correspond à aucune page du site`
      setInputError(message)
      setAnnouncement(message)
      return
    }

    commitPaths([...pathsRef.current, path])
    setInputError(null)
    setAnnouncement(`Chemin ${path} ajouté`)
    setInputValue("")
  }

  const removePath = (path: string) => {
    commitPaths(pathsRef.current.filter((item) => item !== path))
    setInputError(null)
    setAnnouncement(`Chemin ${path} retiré`)
  }

  const [suggestions, setSuggestions] = useState<string[]>([])

  const filterSuggestions = (search: string) =>
    UI_ROUTE_PATTERNS.filter((routePattern) => !pathsRef.current.includes(routePattern) && routePattern.includes(search.trim())).slice(0, MAX_SUGGESTIONS)

  const { isOpen, inputValue, setInputValue, getLabelProps, getInputProps, getMenuProps, getItemProps, highlightedIndex, openMenu } = useCombobox<string>({
    items: suggestions,
    // la sélection alimente les étiquettes, pas le champ : il se vide pour enchaîner
    selectedItem: null,
    onInputValueChange: ({ inputValue }) => {
      setInputError(null)
      setSuggestions(filterSuggestions(inputValue ?? ""))
    },
    onSelectedItemChange: ({ selectedItem }) => {
      if (selectedItem) addPath(selectedItem)
    },
  })

  // Même raison que le reset du formulaire : le segment reste monté, il faut repartir d'un champ
  // propre — sinon une recherche en cours ou un message d'erreur survivraient à l'aller-retour.
  useEffect(() => {
    setInputValue("")
    setInputError(null)
    setAnnouncement("")
  }, [setInputValue])

  return (
    <Box sx={{ position: "relative" }}>
      <Input
        label="Pages de déclenchement"
        hintText="Le widget ne s'affiche que sur ces chemins."
        state={error ? "error" : "default"}
        stateRelatedMessage={error}
        nativeLabelProps={getLabelProps()}
        nativeInputProps={{
          ...getInputProps({
            onFocus: () => {
              setSuggestions(filterSuggestions(inputValue))
              openMenu()
            },
            onKeyDown: (event) => {
              // Entrée sur un élément surligné est gérée par downshift ; sinon on valide la saisie
              // libre, sans quoi la touche soumettrait le formulaire
              if (event.key === "Enter" && highlightedIndex < 0) {
                event.preventDefault()
                addPath(inputValue)
              }
            },
          }),
          placeholder: "Choisissez un chemin dans la liste",
        }}
      />

      <Box
        component="ul"
        {...getMenuProps()}
        sx={{
          listStyle: "none",
          m: 0,
          p: 0,
          position: "absolute",
          zIndex: 2000,
          width: "100%",
          maxHeight: "16rem",
          overflowY: "auto",
          backgroundColor: fr.colors.decisions.background.default.grey.default,
          boxShadow: "0px 1px 8px rgba(8, 67, 85, 0.24)",
          display: isOpen && suggestions.length ? "block" : "none",
        }}
      >
        {isOpen &&
          suggestions.map((routePattern, index) => (
            <Box
              component="li"
              key={routePattern}
              {...getItemProps({ item: routePattern, index })}
              sx={{
                px: fr.spacing("2v"),
                py: fr.spacing("1v"),
                cursor: "pointer",
                fontFamily: "monospace",
                fontSize: "0.875rem",
                backgroundColor: highlightedIndex === index ? fr.colors.decisions.background.alt.blueFrance.default : "transparent",
              }}
            >
              {routePattern}
            </Box>
          ))}
      </Box>

      {paths.length > 0 && (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: fr.spacing("1v"), mt: fr.spacing("2v") }}>
          {paths.map((path) => (
            <Tag key={path} small dismissible nativeButtonProps={{ type: "button", "aria-label": `Retirer le chemin ${path}`, onClick: () => removePath(path) }}>
              {path}
            </Tag>
          ))}
        </Box>
      )}

      <Typography aria-live="polite" className={fr.cx("fr-sr-only")}>
        {announcement}
      </Typography>
    </Box>
  )
}
