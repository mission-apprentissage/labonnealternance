"use client"

import { Button } from "@codegouvfr/react-dsfr/Button"
import { Box } from "@mui/material"
import { useFormikContext } from "formik"
import type { IJob } from "shared"

// Focus le premier champ en erreur dans l'ordre visuel (DOM), pas dans l'ordre des clés de errors
// (non garanti). Fonctionne aussi sur mobile : scrollIntoView + focus sont supportés nativement.
const focusFirstInvalidField = (errorFieldNames: string[]) => {
  const candidates = errorFieldNames
    .map((name) => document.querySelector<HTMLElement>(`[name="${name}"]`))
    .filter((el): el is HTMLElement => Boolean(el))
    .sort((a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1))

  const target = candidates[0]
  if (target) {
    target.scrollIntoView({ behavior: "smooth", block: "center" })
    target.focus({ preventScroll: true })
  }
}

export const FormulaireEditionOffreButtons = ({ offre }: { offre?: IJob }) => {
  const { isSubmitting, submitForm, validateForm, setTouched } = useFormikContext<any>()

  const handleClick = async () => {
    const validationErrors = await validateForm()
    const errorFieldNames = Object.keys(validationErrors)

    if (errorFieldNames.length > 0) {
      // affiche les messages d'erreur sur tous les champs concernés (state="error" des composants
      // DSFR est conditionné par touched pour la plupart des champs du formulaire).
      await setTouched(Object.fromEntries(errorFieldNames.map((name) => [name, true])), false)
      focusFirstInvalidField(errorFieldNames)
      return
    }

    submitForm()
  }

  return (
    <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
      <Button disabled={isSubmitting} onClick={handleClick} data-testid="creer-offre">
        Continuer
      </Button>
    </Box>
  )
}
