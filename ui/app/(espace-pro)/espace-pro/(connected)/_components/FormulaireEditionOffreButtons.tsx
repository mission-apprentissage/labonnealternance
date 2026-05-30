"use client"

import { Button } from "@codegouvfr/react-dsfr/Button"
import { Box } from "@mui/material"
import { useFormikContext } from "formik"
import type { IJob } from "shared"

export const FormulaireEditionOffreButtons = ({ offre, competencesDirty }: { offre?: IJob; competencesDirty: boolean }) => {
  const { isValid, isSubmitting, dirty, submitForm } = useFormikContext<any>()

  const finalDirty = dirty || competencesDirty

  return (
    <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
      <Button disabled={!(isValid && finalDirty) || isSubmitting} onClick={submitForm} data-testid="creer-offre">
        Continuer
      </Button>
    </Box>
  )
}
