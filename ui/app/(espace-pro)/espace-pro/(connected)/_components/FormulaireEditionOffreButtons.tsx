"use client"

import { Button } from "@codegouvfr/react-dsfr/Button"
import { Box } from "@mui/material"
import { useFormikContext } from "formik"
import type { IJob } from "shared"

export const FormulaireEditionOffreButtons = ({ offre, competencesDirty }: { offre?: IJob; competencesDirty: boolean }) => {
  const { isSubmitting, dirty, submitForm, validateForm, setTouched } = useFormikContext<any>()

  const finalDirty = dirty || competencesDirty

  // Le bouton ne dépend plus de isValid : au clic, l'erreur est affichée sur tous les champs invalides et le focus
  // est déplacé sur le premier d'entre eux dans l'ordre du DOM (RGAA 11.10, 12.8), comme createSubmitWithFocusOnError
  // pour les formulaires qui disposent d'une balise <form>.
  const handleClick = async () => {
    const errors = await validateForm()
    const errorNames = Object.keys(errors)
    if (errorNames.length > 0) {
      setTouched(Object.fromEntries(errorNames.map((name) => [name, true])), false)
      const selector = errorNames.map((name) => `[name="${name}"]`).join(", ")
      const firstErrorEl = document.querySelector<HTMLElement>(selector)
      firstErrorEl?.scrollIntoView({ behavior: "smooth", block: "center" })
      firstErrorEl?.focus()
      return
    }
    submitForm()
  }

  return (
    <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
      <Button disabled={!finalDirty || isSubmitting} onClick={handleClick} data-testid="creer-offre">
        Continuer
      </Button>
    </Box>
  )
}
