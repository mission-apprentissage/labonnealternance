"use client"

import { Button } from "@codegouvfr/react-dsfr/Button"
import { Box } from "@mui/material"
import { useFormikContext } from "formik"
import { submitOrFocusFirstInvalidField } from "@/app/_components/submit-with-focus-on-error"

export const FormulaireEditionOffreButtons = () => {
  const formik = useFormikContext<any>()

  return (
    <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
      {/* aria-disabled plutôt que disabled : cf. le bouton « Enregistrer » de CompteRenderer */}
      <Button
        nativeButtonProps={{ "aria-disabled": formik.isSubmitting }}
        onClick={() => {
          if (!formik.isSubmitting) submitOrFocusFirstInvalidField(formik)
        }}
        data-testid="creer-offre"
      >
        Continuer
      </Button>
    </Box>
  )
}
