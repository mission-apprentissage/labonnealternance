"use client"

import { fr } from "@codegouvfr/react-dsfr"
import { Button } from "@codegouvfr/react-dsfr/Button"
import { Box } from "@mui/material"
import { useFormikContext } from "formik"
import { useRouter } from "next/navigation"
import type { IJob } from "shared"
import { ArrowRightLine } from "@/theme/components/icons"

export const FormulaireEditionOffreButtons = ({ offre, competencesDirty }: { offre?: IJob; competencesDirty: boolean }) => {
  const router = useRouter()
  const { isValid, isSubmitting, dirty, submitForm } = useFormikContext<any>()

  const finalDirty = dirty || competencesDirty

  return (
    <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
      <Box sx={{ mr: fr.spacing("4v") }}>
        <Button className="fr-btn--secondary" onClick={() => router.back()}>
          Annuler
        </Button>
      </Box>
      <Button disabled={!(isValid && finalDirty) || isSubmitting} onClick={submitForm} data-testid="creer-offre">
        <ArrowRightLine sx={{ mr: fr.spacing("2v") }} />
        {offre?._id ? "Mettre à jour" : "Créer l'offre"}
      </Button>
    </Box>
  )
}
