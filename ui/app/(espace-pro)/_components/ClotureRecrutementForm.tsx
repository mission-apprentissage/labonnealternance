import { fr } from "@codegouvfr/react-dsfr"
import Alert from "@codegouvfr/react-dsfr/Alert"
import Button from "@codegouvfr/react-dsfr/Button"
import Select from "@codegouvfr/react-dsfr/Select"
import { Box, Typography } from "@mui/material"
import { captureException } from "@sentry/nextjs"
import { FormikProvider, useFormik } from "formik"
import { useRef, useState } from "react"
import { JOB_STATUS } from "shared"
import { z } from "zod"
import { toFormikValidationSchema } from "zod-formik-adapter"

import CustomInput from "@/app/_components/CustomInput"
import { createSubmitWithFocusOnError } from "@/app/_components/submit-with-focus-on-error"

export const motifsPourvus = ["J'ai pourvu l'offre avec La bonne alternance", "J'ai pourvu l'offre sans l'aide de La bonne alternance"]
const motifSansAideLba = motifsPourvus[1]
const motifAutre = "Autre"
export const autreMotifs = [
  "Je ne suis plus en recherche",
  "Je ne reçois pas de candidature",
  "Les candidatures reçues ne sont pas assez qualifiées",
  "J'ai reçu assez de candidatures",
  motifAutre,
]

export const motifs = [...motifsPourvus, ...autreMotifs]

const canalAutre = "Autre"
export const canaux = [
  "Via un site internet",
  "Via une école, un CFA",
  "Via un organisme de recrutement (France Travail, Mission locale, ...)",
  "Via mon réseau personnel",
  "Le candidat m'a contacté de façon autonome",
  "Via les réseaux sociaux",
  canalAutre,
]

const zodSchema = z.object({
  motif: z.string({ error: "Sélectionnez un motif" }).min(1, "Sélectionnez un motif"),
  motifPrecision: z.string().optional(),
  canal: z.string().optional(),
  canalPrecision: z.string().optional(),
})

export type IClotureRecrutementFormValues = z.output<typeof zodSchema>

export interface IClotureRecrutementPayload {
  job_status: JOB_STATUS.POURVUE | JOB_STATUS.ANNULEE
  job_status_comment: string
  job_status_comment_precision?: string
  job_recruitment_channel?: string
}

export interface ClotureRecrutementFormProps {
  offreId: string
  onSuccess: (result?: { alreadyClosed?: boolean }) => void
  onCancel: () => void
  submit: (offreId: string, payload: IClotureRecrutementPayload) => Promise<{ alreadyClosed?: boolean } | unknown>
}

export default function ClotureRecrutementForm({ offreId, onSuccess, onCancel, submit }: ClotureRecrutementFormProps) {
  const [submitError, setSubmitError] = useState(false)

  const onSubmit = async (values: IClotureRecrutementFormValues) => {
    const { motif, motifPrecision, canal, canalPrecision } = values
    const estPourvueSansAideLba = motif === motifSansAideLba
    const jobStatus = motifsPourvus.includes(motif) ? JOB_STATUS.POURVUE : JOB_STATUS.ANNULEE

    const job_recruitment_channel = estPourvueSansAideLba ? (canal === canalAutre ? canalPrecision || undefined : canal) || undefined : undefined
    const job_status_comment_precision = motif === motifAutre ? motifPrecision || undefined : undefined

    setSubmitError(false)
    let result: unknown
    try {
      result = await submit(offreId, {
        job_status: jobStatus,
        job_status_comment: motif,
        job_status_comment_precision,
        job_recruitment_channel,
      })
    } catch (error) {
      // createSubmitWithFocusOnError ne capture pas le rejet de submitForm : l'échec est rapporté ici
      captureException(error)
      setSubmitError(true)
      return
    }
    onSuccess(result as { alreadyClosed?: boolean } | undefined)
  }

  const formik = useFormik({
    initialValues: {
      motif: "",
      motifPrecision: "",
      canal: "",
      canalPrecision: "",
    },
    validationSchema: toFormikValidationSchema(zodSchema),
    enableReinitialize: true,
    onSubmit,
  })

  const { motif, canal } = formik.values
  const motifError = formik.touched.motif && formik.errors.motif
  const formRef = useRef<HTMLFormElement>(null)

  return (
    <FormikProvider value={formik}>
      {/* Figma (mode dev) : la modale empile ses éléments dans un flex column avec un gap fixe de 16px (fr.spacing("4v")),
          au lieu des marges par défaut de DSFR (24px entre deux .fr-select-group / .fr-input-group consécutifs). */}
      <Box
        component="form"
        ref={formRef}
        noValidate
        onSubmit={createSubmitWithFocusOnError(formRef, formik)}
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: fr.spacing("4v"),
          "& .fr-select-group, & .fr-input-group": { marginBottom: "0 !important" },
        }}
      >
        <Typography className={fr.cx("fr-text--xl", "fr-text--bold")} component="h2" sx={{ mb: 0 }}>
          Clôturer votre recrutement
        </Typography>

        <Typography sx={{ color: "#3A3A3A", lineHeight: "24px" }}>Vous ne recevrez plus de candidatures.</Typography>

        <Select
          label="Motif (obligatoire)"
          state={motifError ? "error" : "default"}
          stateRelatedMessage={motifError}
          nativeSelectProps={{
            onChange: async (event) => formik.setFieldValue("motif", event.target.value, true),
            onBlur: formik.handleBlur,
            name: "motif",
            required: true,
            // aria-invalid : cf. HandiEngagementSelect
            "aria-invalid": Boolean(motifError),
          }}
        >
          <option disabled hidden selected value="">
            Sélectionner un motif
          </option>
          {motifs.map((reason) => (
            <option key={reason} value={reason}>
              {reason}
            </option>
          ))}
        </Select>

        {motif === motifSansAideLba && (
          <Select
            label="Comment avez-vous pourvu votre offre ? (facultatif)"
            nativeSelectProps={{
              onChange: async (event) => formik.setFieldValue("canal", event.target.value, true),
              name: "canal",
            }}
          >
            <option disabled hidden selected value="">
              Sélectionner une option
            </option>
            {canaux.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        )}

        {motif === motifSansAideLba && canal === canalAutre && (
          <CustomInput label="Par quel autre moyen avez-vous pourvu l'offre ? (facultatif)" name="canalPrecision" required={false} pb={0} />
        )}

        {motif === motifAutre && <CustomInput label="Précisez votre motif (facultatif)" name="motifPrecision" required={false} pb={0} />}

        {submitError && <Alert severity="error" small description="La clôture n'a pas pu être enregistrée. Réessayez ou contactez le support de La bonne alternance." />}

        <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
          <Box sx={{ ml: fr.spacing("3v") }}>
            <Button type="button" priority="secondary" onClick={() => onCancel()}>
              Annuler
            </Button>
          </Box>
          <Box sx={{ ml: fr.spacing("3v") }}>
            <Button type="submit" disabled={formik.isSubmitting}>
              Confirmer
            </Button>
          </Box>
        </Box>
      </Box>
    </FormikProvider>
  )
}
