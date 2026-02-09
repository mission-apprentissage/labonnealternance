import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import Select from "@codegouvfr/react-dsfr/Select"
import { Box, Typography } from "@mui/material"
import { useQueryClient } from "@tanstack/react-query"
import { FormikProvider, useFormik } from "formik"
import { JOB_STATUS } from "shared"
import { z } from "zod"
import { toFormikValidationSchema } from "zod-formik-adapter"

import CustomInput from "@/app/_components/CustomInput"
import { useToast } from "@/app/hooks/useToast"
import { ModalReadOnly } from "@/components/ModalReadOnly"
import { cancelOffreFromAdmin } from "@/utils/api"

const zodSchema = z.object({
  motif: z.string().nonempty(),
  autreMotif: z.string().optional(),
})

const motifsPourvus = ["J'ai pourvu l'offre avec La bonne alternance", "J'ai pourvu l'offre sans l'aide de La bonne alternance"]
const motifAutre = "Autre"
const autreMotifs = [
  "Je ne suis plus en recherche",
  "Je ne reçois pas de candidature",
  "Je n’ai pas pu personnaliser mon offre",
  "Les candidatures reçues ne sont pas assez qualifiées",
  motifAutre,
]

const motifs = [...motifsPourvus, ...autreMotifs]

export interface ConfirmationSuppressionOffreProps {
  isOpen: boolean
  onClose: () => void
  offre: { _id: string }
}

export default function ConfirmationSuppressionOffre(props: ConfirmationSuppressionOffreProps) {
  const toast = useToast()
  const client = useQueryClient()

  const resetState = () => {
    onClose()
  }

  const onSubmit = (values: z.output<typeof zodSchema>) => {
    const { motif, autreMotif } = values
    const estPouvue = motifsPourvus.includes(motif)
    const jobStatus = estPouvue ? JOB_STATUS.POURVUE : JOB_STATUS.ANNULEE
    const motifFinal = (motif === motifAutre ? autreMotif || motif : motif) || undefined
    cancelOffreFromAdmin(offre._id, { job_status: jobStatus, job_status_comment: motifFinal })
      .then(() => {
        toast({
          title: `Offre supprimée.`,
          description: "Votre offre a bien été mise à jour.",
        })
      })
      .then(() => resetState())
      .finally(async () =>
        client.invalidateQueries({
          queryKey: ["offre-liste"],
        })
      )
  }

  const formik = useFormik({
    initialValues: {
      motif: "",
      autreMotif: "",
    },
    validationSchema: toFormikValidationSchema(zodSchema),
    enableReinitialize: true,
    onSubmit,
  })

  const { isOpen, onClose, offre } = props

  return (
    <ModalReadOnly isOpen={isOpen} onClose={onClose}>
      <Box sx={{ pb: fr.spacing("4v"), px: fr.spacing("4v") }}>
        <Typography className={fr.cx("fr-text--xl", "fr-text--bold")} sx={{ mb: fr.spacing("2v") }} component="h2">
          Êtes-vous certain de vouloir supprimer votre offre ?
        </Typography>

        <Box
          sx={{
            pb: 2,
          }}
        >
          <Typography sx={{ mb: 1, color: "#3A3A3A", lineHeight: "24px" }}>Celle-ci sera définitivement supprimée. Vous ne recevrez plus de candidatures.</Typography>
          <FormikProvider value={formik}>
            <form onSubmit={formik.handleSubmit}>
              <Select
                label="Motif de la suppression (obligatoire) *"
                nativeSelectProps={{
                  onChange: async (event) => formik.setFieldValue("motif", event.target.value, true),
                  name: "motif",
                  required: true,
                }}
              >
                <option disabled hidden selected value="">
                  Sélectionnez une valeur...
                </option>
                {motifs.map((reason) => (
                  <option key={reason} value={reason}>
                    {reason}
                  </option>
                ))}
              </Select>
              {formik.values.motif === motifAutre && <CustomInput label="Précisez votre motif (facultatif)" name="autreMotif" required={false} />}
              <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 3 }}>
                <Box sx={{ ml: fr.spacing("3v") }}>
                  <Button type="button" priority="secondary" onClick={() => resetState()}>
                    Annuler
                  </Button>
                </Box>
                <Box sx={{ ml: fr.spacing("3v") }}>
                  <Button type="submit" disabled={!formik.dirty || !formik.isValid}>
                    Confirmer la suppression
                  </Button>
                </Box>
              </Box>
            </form>
          </FormikProvider>
        </Box>
      </Box>
    </ModalReadOnly>
  )
}
