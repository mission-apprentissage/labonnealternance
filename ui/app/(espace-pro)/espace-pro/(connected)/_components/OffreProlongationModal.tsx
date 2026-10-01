import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import { Typography } from "@mui/material"
import Box from "@mui/material/Box"
import { Formik } from "formik"
import { JOB_START_TYPE } from "shared"
import dayjs from "shared/helpers/dayjs"
import * as Yup from "yup"
import { ModalTitle } from "@/app/_components/Title/ModalTitle"
import type { useDisclosure } from "@/app/hooks/use-disclosure"
import { ModalReadOnly } from "@/components/ModalReadOnly"
import { submitOrFocusFirstInvalidField } from "./FormulaireEditionOffreButtons"
import { JobStartDateFields } from "./JobStartDateFields"

const ISO_DATE_FORMAT = "YYYY-MM-DD"
const FR_DATE_FORMAT = "DD/MM/YYYY"

export const OffreProlongationModal = ({
  modalControls,
  onOffreProlongationSubmit,
}: {
  modalControls: ReturnType<typeof useDisclosure>
  onOffreProlongationSubmit: (props: { job_start_type: JOB_START_TYPE; job_start_date_flexible: boolean; job_start_date: string }) => void
}) => {
  const { isOpen, onClose } = modalControls

  const minStartDate = dayjs().startOf("day")
  const maxStartDate = dayjs().add(2, "years")

  const jobStartDateYup = Yup.date()
    .min(minStartDate.toDate(), `La date de début doit être à partir du ${minStartDate.format(FR_DATE_FORMAT)}`)
    .max(maxStartDate.toDate(), `La date de début doit être avant le ${maxStartDate.format(FR_DATE_FORMAT)}`)
    .required("Champ obligatoire")

  return (
    <ModalReadOnly isOpen={isOpen} onClose={onClose}>
      <Box>
        <Formik
          validateOnMount
          enableReinitialize={true}
          initialValues={{}}
          validationSchema={Yup.object().shape({
            job_start_type: Yup.mixed<JOB_START_TYPE>().oneOf([JOB_START_TYPE.DES_QUE_POSSIBLE, JOB_START_TYPE.PRECISE_DATE], "Champ obligatoire").required("Champ obligatoire"),
            job_start_date_flexible: Yup.boolean().default(false),
            job_start_date: jobStartDateYup,
          })}
          onSubmit={(values: any) => {
            onOffreProlongationSubmit(values)
          }}
        >
          {(formik) => {
            return (
              <>
                <Box sx={{ px: fr.spacing("8v") }}>
                  <ModalTitle>Prolongez votre offre</ModalTitle>
                  <Typography
                    sx={{
                      my: fr.spacing("4v"),
                      fontSize: "16px",
                      lineHeight: "24px",
                      color: "#3A3A3A",
                    }}
                  >
                    Pour que votre offre reste valide, certaines informations nécessitent une mise à jour :
                  </Typography>
                  <Typography sx={{ fontSize: "0.875rem", color: fr.colors.decisions.text.default.grey.default }}>Tous les champs sont obligatoires.</Typography>
                  <Box sx={{ mt: fr.spacing("6v") }}>
                    <JobStartDateFields min={minStartDate.format(ISO_DATE_FORMAT)} max={maxStartDate.format(ISO_DATE_FORMAT)} />
                  </Box>
                </Box>
                <Box
                  sx={(theme) => ({
                    display: "flex",
                    justifyContent: "flex-end",
                    padding: fr.spacing("8v"),
                    mt: fr.spacing("12v"),
                    gap: fr.spacing("4v"),
                    borderTop: "solid 1px #DDDDDD",
                    [theme.breakpoints.down("md")]: {
                      flexDirection: "column",
                      button: {
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        width: "100%",
                        padding: fr.spacing("4v"),
                      },
                    },
                  })}
                >
                  <Button priority="secondary" onClick={modalControls.onClose}>
                    Annuler
                  </Button>
                  <Button priority="primary" disabled={formik.isSubmitting} onClick={() => submitOrFocusFirstInvalidField(formik)}>
                    Prolonger mon offre
                  </Button>
                </Box>
              </>
            )
          }}
        </Formik>
      </Box>
    </ModalReadOnly>
  )
}
