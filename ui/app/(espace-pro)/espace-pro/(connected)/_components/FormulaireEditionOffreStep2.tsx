"use client"

import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import Checkbox from "@codegouvfr/react-dsfr/Checkbox"
import { Box, Typography } from "@mui/material"
import { Formik, useField, useFormikContext } from "formik"
import { type IJob, ZJobFields } from "shared"
import type z from "zod"
import { toFormikValidationSchema } from "zod-formik-adapter"

const questions = [
  "Pourquoi souhaitez-vous rejoindre notre entreprise ?",
  "Qu’aimeriez-vous apprendre à travers cette alternance ?",
  "Qu’auriez-vous envie d’accomplir ou de mener à bien durant cette alternance ?",
  "Quels outils ou méthodes de travail maîtrisez-vous et souhaitez-vous approfondir ?",
  "Quelles compétences souhaitez-vous développer grâce à cette expérience ?",
  "Avez-vous déjà réalisé une expérience (stage, job, bénévolat) en lien avec ce poste ?",
  "Pourquoi souhaitez-vous effectuer votre alternance dans ce secteur d'activité ?",
]

const ZStep2Form = ZJobFields.pick({
  to_applicant_questions: true,
})

type IStep2Form = z.output<typeof ZStep2Form>

export const FormulaireEditionOffreStep2 = ({ offre, onSubmit, onCancel }: { offre?: IJob; onSubmit?: (values: any) => void; onCancel: () => void }) => {
  return (
    <Formik<IStep2Form>
      validateOnMount
      enableReinitialize={true}
      initialValues={{
        to_applicant_questions: offre?.to_applicant_questions ?? [],
      }}
      validationSchema={toFormikValidationSchema(ZStep2Form)}
      onSubmit={onSubmit}
    >
      {({ values }) => (
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
            Étape 2/3 : Questions pour les candidats
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
            Vos questions pour les candidats (Facultatif)
          </Typography>
          <Checkboxs
            name="to_applicant_questions"
            label="Sélectionnez jusqu’à 3 questions pour mieux comprendre les motivations des candidats."
            options={questions}
            infoText="Le candidat devra obligatoirement répondre à vos questions pour pouvoir soumettre sa candidature, excepté pour les candidatures provenant de plateformes partenaires."
          />
          <Typography
            sx={{
              fontSize: "12px",
              lineHeight: "24px",
              color: "#000091",
              mt: fr.spacing("6v"),
            }}
          >
            Vous avez une question à suggérer ? Écrivez-nous à <a href="mailto:contact@labonnealternance.apprentissage.beta.fr">contact@labonnealternance.apprentissage.beta.fr</a>
          </Typography>
          <Buttons offre={offre} onCancel={onCancel} />
        </>
      )}
    </Formik>
  )
}

const Checkboxs = ({ name, options, label, infoText }: { name: string; options: string[]; label: string; infoText?: string }) => {
  const [input, meta, helper] = useField<string[] | undefined>(name)
  const { value = [] } = input
  const { error, touched } = meta
  const displayedErrorOpt = touched && error

  const isOptionChecked = (option: string): boolean => value.includes(option)

  const toggleOption = (option: string) => {
    const newValue = isOptionChecked(option) ? value.filter((x) => x !== option) : [...value, option]
    helper.setTouched(true)
    helper.setValue(newValue, true)
  }

  return (
    <>
      <Checkbox
        legend={label}
        options={options.map((option) => ({
          label: option,
          nativeInputProps: {
            checked: isOptionChecked(option),
            onChange: () => {
              toggleOption(option)
            },
          },
        }))}
        state={displayedErrorOpt ? "error" : "default"}
        stateRelatedMessage={displayedErrorOpt ? `${error}` : undefined}
      />
      {Boolean(infoText) && <InfoText>{infoText}</InfoText>}
    </>
  )
}

const InfoText = ({ children }: { children: React.ReactNode }) => {
  if (!children) {
    return null
  }
  return (
    <Box sx={{ marginTop: 0, display: "flex", gap: "4px", alignItems: "flex-start", color: "var(--text-default-info)" }}>
      <Box sx={{ mt: "2px !important" }} className="fr-info-text" />
      <Typography sx={{ fontSize: "12px", lineHeight: "20px" }}>{children}</Typography>
    </Box>
  )
}

const Buttons = ({ offre, onCancel }: { offre?: IJob; onCancel: () => void }) => {
  const { isValid, isSubmitting, submitForm } = useFormikContext<any>()

  return (
    <Box
      sx={{ display: "flex", justifyContent: "flex-end", borderTop: `1px solid ${fr.colors.decisions.border.default.grey.default}`, pt: fr.spacing("6v"), mt: fr.spacing("6v") }}
    >
      <Box sx={{ mr: fr.spacing("4v") }}>
        <Button aria-label="Retour vers l'étape 1 du formulaire de dépôt d'offre" className="fr-btn--secondary" onClick={() => onCancel()}>
          Retour
        </Button>
      </Box>
      <Button disabled={!isValid || isSubmitting} aria-label="Continuer vers l'étape 3 du formulaire de dépôt d'offre" onClick={submitForm} data-testid="continuer-creer-offre">
        Continuer
      </Button>
    </Box>
  )
}
