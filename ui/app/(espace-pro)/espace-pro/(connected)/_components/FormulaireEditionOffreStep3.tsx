"use client"

import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import { Box, Typography } from "@mui/material"
import { Formik, useFormikContext } from "formik"
import type { IJob } from "shared"

// TODO : remplacer ce formulaire dummy par le contenu réel de l'étape.
type IStep3Form = Record<string, never>

export const FormulaireEditionOffreStep3 = ({
  offre,
  onSubmit,
  onCancel,
  isFtEligible = true,
  totalSteps = 4,
}: {
  offre?: IJob
  onSubmit?: (values: any) => void
  onCancel: () => void
  isFtEligible?: boolean
  totalSteps?: number
}) => {
  return (
    <Formik<IStep3Form> validateOnMount enableReinitialize={true} initialValues={{}} onSubmit={onSubmit}>
      {() => (
        <>
          <Typography
            component="h1"
            sx={{
              fontWeight: 700,
              color: "#000091",
              mb: fr.spacing("6v"),
              fontSize: { xs: "18px !important", md: "20px !important" },
              lineHeight: { xs: "24px !important", md: "28px !important" },
            }}
          >
            Étape 3/{totalSteps} : Titre de l'étape à définir
          </Typography>
          <Typography
            component="h2"
            sx={{
              fontWeight: 700,
              mb: fr.spacing("6v"),
              fontSize: { xs: "22px !important", md: "32px !important" },
              lineHeight: { xs: "28px !important", md: "40px !important" },
            }}
          >
            Titre de l'étape à définir
          </Typography>
          {/* TODO : contenu de l'étape */}
          <Buttons offre={offre} onCancel={onCancel} isFtEligible={isFtEligible} />
        </>
      )}
    </Formik>
  )
}

const Buttons = ({ offre, onCancel, isFtEligible }: { offre?: IJob; onCancel: () => void; isFtEligible: boolean }) => {
  const { isSubmitting, submitForm } = useFormikContext<IStep3Form>()

  return (
    <Box
      sx={{ display: "flex", justifyContent: "flex-end", borderTop: `1px solid ${fr.colors.decisions.border.default.grey.default}`, pt: fr.spacing("6v"), mt: fr.spacing("6v") }}
    >
      <Box sx={{ mr: fr.spacing("4v") }}>
        <Button aria-label="Retour vers l'étape 2 du formulaire de dépôt d'offre" className="fr-btn--secondary" onClick={() => onCancel()}>
          Retour
        </Button>
      </Box>
      {isFtEligible ? (
        <Button disabled={isSubmitting} aria-label="Continuer vers l'étape 4 du formulaire de dépôt d'offre" onClick={submitForm} data-testid="continuer-creer-offre">
          Continuer
        </Button>
      ) : (
        <Button disabled={isSubmitting} onClick={submitForm} data-testid="creer-offre">
          {offre?._id ? "Continuer et Mettre à jour l'offre" : "Continuer et Créer l'offre"}
        </Button>
      )}
    </Box>
  )
}
