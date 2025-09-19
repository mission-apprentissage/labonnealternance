"use client"

import { fr } from "@codegouvfr/react-dsfr"
import { Button } from "@codegouvfr/react-dsfr/Button"
import { Box } from "@mui/material"
import { useFormikContext } from "formik"
import { useRouter } from "next/navigation"
import { IJobJson } from "shared/models/job.model"

import { ArrowRightLine } from "@/theme/components/icons"

export const FormulaireEditionOffreButtons = ({ offre, competencesDirty }: { offre?: IJobJson; competencesDirty: boolean }) => {
  const router = useRouter()

  const { isValid, isSubmitting, dirty, submitForm } = useFormikContext<any>()
  return (
    <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
      <Box sx={{ mr: fr.spacing("2w") }}>
        <Button className="fr-btn--secondary" onClick={() => router.back()}>
          Annuler
        </Button>
      </Box>
      <Button disabled={!(isValid && (dirty || competencesDirty)) || isSubmitting} onClick={submitForm} data-testid="creer-offre">
        <ArrowRightLine sx={{ mr: fr.spacing("1w") }} />
        {offre?._id ? "Mettre à jour" : "Créer l'offre"}
      </Button>
    </Box>
  )
}
