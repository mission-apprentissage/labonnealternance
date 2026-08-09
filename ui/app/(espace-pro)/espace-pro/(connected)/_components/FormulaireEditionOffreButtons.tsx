"use client"

import { Button } from "@codegouvfr/react-dsfr/Button"
import { Box } from "@mui/material"
import { useFormikContext } from "formik"
import type { IJob } from "shared"

// Certains champs (ex: job_type, un groupe de checkboxes) n'ont pas d'élément DOM avec
// name="<clé Formik>" : chaque checkbox a son propre name. On les repère via un conteneur
// marqué data-field-name="<clé>" et on cible son premier élément focusable.
const findFieldElement = (name: string): HTMLElement | null => {
  const escapedName = CSS.escape(name)
  const container = document.querySelector<HTMLElement>(`[data-field-name="${escapedName}"]`)
  if (container) {
    return container.querySelector<HTMLElement>("input, textarea, select, button, [tabindex]") ?? container
  }
  return document.querySelector<HTMLElement>(`[name="${escapedName}"]`)
}

// Focus le premier champ en erreur dans l'ordre visuel (DOM), pas dans l'ordre des clés de errors
// (non garanti). Fonctionne aussi sur mobile : scrollIntoView + focus sont supportés nativement.
const focusFirstInvalidField = (errorFieldNames: string[]) => {
  const candidates = errorFieldNames
    .map((name) => findFieldElement(name))
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
