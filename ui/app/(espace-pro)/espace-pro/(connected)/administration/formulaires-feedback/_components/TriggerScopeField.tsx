"use client"

import { fr } from "@codegouvfr/react-dsfr"
import Input from "@codegouvfr/react-dsfr/Input"
import Tag from "@codegouvfr/react-dsfr/Tag"
import { Box, Typography } from "@mui/material"
import { useField } from "formik"
import { useId, useState } from "react"

const FIELD_NAME = "trigger.scope"

/**
 * Saisie des chemins de déclenchement sous forme d'étiquettes.
 *
 * Les lecteurs d'écran ne perçoivent pas l'apparition ni la disparition d'une étiquette :
 * chaque ajout et chaque retrait est donc annoncé dans une région `aria-live`, et le bouton de
 * retrait porte le chemin concerné dans son libellé (RGAA 7.4, 11.10).
 */
export function TriggerScopeField() {
  const [field, meta, helpers] = useField<string[]>(FIELD_NAME)
  const [draft, setDraft] = useState("")
  const [announcement, setAnnouncement] = useState("")
  const hintId = useId()

  const paths = field.value ?? []
  const hasError = Boolean(meta.error && meta.touched)

  const addPath = () => {
    const path = draft.trim()
    if (!path) return
    if (paths.includes(path)) {
      setAnnouncement(`Le chemin ${path} est déjà dans la liste`)
      setDraft("")
      return
    }
    helpers.setValue([...paths, path])
    setAnnouncement(`Chemin ${path} ajouté`)
    setDraft("")
  }

  const removePath = (path: string) => {
    helpers.setValue(paths.filter((item) => item !== path))
    setAnnouncement(`Chemin ${path} retiré`)
  }

  return (
    <Box>
      <Input
        label="Pages de déclenchement"
        hintText="Le widget ne s'affiche que sur ces chemins. Validez chaque chemin avec la touche Entrée."
        state={hasError ? "error" : "default"}
        stateRelatedMessage={hasError ? String(meta.error) : undefined}
        nativeInputProps={{
          value: draft,
          placeholder: "Ajouter un chemin…",
          "aria-describedby": hintId,
          onChange: (event) => setDraft(event.target.value),
          onBlur: () => helpers.setTouched(true),
          onKeyDown: (event) => {
            if (event.key === "Enter") {
              // sans ça, Entrée soumettrait le formulaire au lieu d'ajouter le chemin
              event.preventDefault()
              addPath()
            }
          },
        }}
      />

      <Typography id={hintId} className={fr.cx("fr-hint-text")} sx={{ mb: fr.spacing("2v") }}>
        Exemples : <code>/recherche</code> pour une page unique, <code>/entreprise/:id</code> pour un segment variable, <code>/formation/*</code> pour tout ce qui suit.
      </Typography>

      {paths.length > 0 && (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: fr.spacing("1v") }}>
          {paths.map((path) => (
            <Tag key={path} small dismissible nativeButtonProps={{ type: "button", "aria-label": `Retirer le chemin ${path}`, onClick: () => removePath(path) }}>
              {path}
            </Tag>
          ))}
        </Box>
      )}

      <Box aria-live="polite" className={fr.cx("fr-sr-only")}>
        {announcement}
      </Box>
    </Box>
  )
}
