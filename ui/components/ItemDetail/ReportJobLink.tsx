"use client"
import Button from "@codegouvfr/react-dsfr/Button"
import { Box, Stack, Typography, TextField } from "@mui/material"
import { Formik } from "formik"
import Image from "next/image"
import { LBA_ITEM_TYPE } from "shared/constants/lbaitem"
import { z } from "zod"
import { toFormikValidationSchema } from "zod-formik-adapter"

import { CustomFormControl } from "@/app/_components/CustomFormControl"
import { useLocalStorage } from "@/app/hooks/useLocalStorage"
import { useDisclosure } from "@/common/hooks/useDisclosure"
import { reportLbaItem } from "@/utils/api"

import { CustomRadio } from "../../app/_components/CustomRadio"
import { InfoTooltipOrModal } from "../InfoTooltipOrModal"
import { ModalReadOnly } from "../ModalReadOnly"

const additionalMessageByMotif = {
  "Offre offensante ou discriminatoire": "Pouvez-vous préciser l'offense ou la discrimination en question (dans la description de l'annonce, lors de l'entretien, etc) ?",
  "Offre inexacte ou expirée": "Précisez les informations obsolètes (numéro de téléphone, adresse postale, etc)",
  "Tentative d’escroquerie": "Pouvez-vous préciser ce qui vous a laissé penser qu'il s'agissait d'une escroquerie (demande de coordonnées bancaires, etc.) ?",
  "Informations erronées": "Précisez les informations erronées (numéro de téléphone, adresse postale, etc)",
} as Record<string, string>

const noAdditionalMessage = ["Entreprise fermée"]

const contentByItemType: Partial<
  Record<
    LBA_ITEM_TYPE,
    {
      title: string
      introductionText: string
      motifs: string[]
    }
  >
> = {
  [LBA_ITEM_TYPE.RECRUTEURS_LBA]: {
    title: "Signaler l’entreprise",
    introductionText:
      "Des contrôles sont réalisés pour vérifier la légalité et la conformité des entreprises exposées. Si malgré ces contrôles vous constatez des contenus inappropriés, signalez cette opportunité et une attention particulière y sera apportée.",
    motifs: ["Informations erronées", "Entreprise fermée", "Autre"],
  },
  [LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA]: {
    title: "Signaler l’offre",
    introductionText:
      "Des contrôles sont réalisés pour vérifier la légalité et la conformité des offres exposées. Si malgré ces contrôles vous constatez des contenus inappropriés, signalez cette opportunité et une attention particulière y sera apportée.",
    motifs: ["Offre offensante ou discriminatoire", "Offre inexacte ou expirée", "Fausse offre provenant d’un centre de formation", "Tentative d’escroquerie", "Autre"],
  },
}

const ZFormValues = z.object({
  reason: z.string(),
  reason_details: z.string().nullish(),
})

type IFormValues = z.output<typeof ZFormValues>

export const ReportJobLink = ({
  linkLabelNotReported,
  linkLabelReported,
  tooltip,
  itemId,
  type,
}: {
  itemId: string
  linkLabelNotReported: string
  linkLabelReported: string
  tooltip: React.ReactNode
  type: LBA_ITEM_TYPE
}) => {
  const { storedValue, setLocalStorage } = useLocalStorage(`report-job-${itemId}`, false)
  const { isOpen: isModalOpen, onClose: closeModal, onOpen: openModal } = useDisclosure()

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const onReport = async ({ reason, reason_details }: IFormValues) => {
    if (storedValue) {
      return
    }
    setLocalStorage(true)
    await reportLbaItem(itemId, type, reason, reason_details || undefined)
  }

  const content = contentByItemType[type] ?? contentByItemType.offres_emploi_lba

  return (
    <Stack direction="row" alignItems="center">
      {storedValue ? (
        <Button priority="tertiary no outline" disabled iconId="ri-check-line" iconPosition="left" size="small">
          {linkLabelReported}
        </Button>
      ) : (
        <Button priority="tertiary no outline" iconId="ri-flag-line" iconPosition="left" size="small" onClick={openModal}>
          {linkLabelNotReported}
        </Button>
      )}
      <InfoTooltipOrModal tooltipContent={tooltip}>
        <Button priority="tertiary no outline" iconId="ri-question-line" size="small" title="label" />
      </InfoTooltipOrModal>
      <ModalReadOnly isOpen={isModalOpen} onClose={closeModal}>
        {storedValue ? (
          <ReportedAcknowledgement />
        ) : (
          <>
            <Typography variant="h1" sx={{ fontSize: "24px", fontWeight: 700 }}>
              {content.title}
            </Typography>
            <Typography sx={{ my: 3, fontSize: "14px" }}>{content.introductionText}</Typography>
            <Formik initialValues={{ reason: "", reason_details: "" }} validationSchema={toFormikValidationSchema(ZFormValues)} onSubmit={(formikValues) => onReport(formikValues)}>
              {({ values, handleChange, handleBlur, submitForm, dirty, isValid, isSubmitting, setFieldValue }) => {
                return (
                  <Stack direction="column" spacing={2}>
                    <Typography sx={{ fontWeight: 700 }}>Veuillez sélectionner un motif dans la liste ci-dessous :</Typography>
                    <CustomRadio
                      radioProps={{
                        sx: {
                          display: "flex",
                          flexDirection: "column",
                          gap: 1,
                          mb: 1,
                        },
                      }}
                      size="small"
                      name="reason"
                      value={values.reason}
                      onChange={(_, newValue) => setFieldValue("reason", newValue, true)}
                      possibleValues={content.motifs}
                    />
                    {values.reason && !noAdditionalMessage.includes(values.reason) && (
                      <CustomFormControl
                        required={false}
                        name="reason_details"
                        label={
                          <>
                            <Box sx={{ fontWeight: 400 }}>
                              {additionalMessageByMotif[values.reason] ?? "Informations complémentaires"}
                              <Box component="span" sx={{ fontWeight: 400, color: "#666666" }}>
                                {" "}
                                (Facultatif)
                              </Box>
                            </Box>
                          </>
                        }
                      >
                        <TextField
                          multiline
                          rows={4}
                          data-testid="reason_details"
                          name="reason_details"
                          onBlur={handleBlur}
                          onChange={handleChange}
                          value={values.reason_details}
                        />
                      </CustomFormControl>
                    )}
                    <Button disabled={!(isValid && dirty) || isSubmitting} onClick={submitForm} data-testid="report_offer">
                      Envoyer le signalement
                    </Button>
                  </Stack>
                )
              }}
            </Formik>
          </>
        )}
      </ModalReadOnly>
    </Stack>
  )
}

const ReportedAcknowledgement = () => {
  return (
    <Box sx={{ justifySelf: "center" }}>
      <Stack direction="row" spacing={4} alignItems="center" sx={{ mb: 2 }}>
        <Image width={56} height={56} src="/images/paperplane2.svg" alt="" />
        <Typography variant="h2">Votre signalement a bien été envoyé à notre équipe.</Typography>
      </Stack>
      <Typography component="span">Merci de votre participation à l'amélioration du service La bonne alternance.</Typography>
    </Box>
  )
}
