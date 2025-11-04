import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import { Box, Typography, CircularProgress, Input, FormControl, FormLabel, FormHelperText, Grid } from "@mui/material"
import type { Result } from "email-misspelled"
import emailMisspelled, { top100 } from "email-misspelled"
import { useFormik } from "formik"
import type { ChangeEvent } from "react"
import { useState } from "react"
import type { ILbaItemLbaCompanyJson, ILbaItemLbaJobJson, ILbaItemPartnerJobJson } from "shared"
import { LBA_ITEM_TYPE, LBA_ITEM_TYPE_OLD } from "shared/constants/lbaitem"
import { toFormikValidationSchema } from "zod-formik-adapter"

import CandidatureLbaFileDropzone from "./CandidatureLbaFileDropzone"
import CandidatureLbaMandataireMessage from "./CandidatureLbaMandataireMessage"
import CandidatureLbaMessage from "./CandidatureLbaMessage"
import { CandidatureTasksChecklist } from "./CandidatureTasksChecklist"
import type { IApplicationSchemaInitValues } from "./services/getSchema"
import { ApplicationFormikSchema, getInitialSchemaValues } from "./services/getSchema"
import InfoBanner from "@/components/InfoBanner/InfoBanner"
import { DsfrLink } from "@/components/dsfr/DsfrLink"
import ModalCloseButton from "@/app/_components/ModalCloseButton"

const emailChecker = emailMisspelled({ maxMisspelled: 3, domains: top100 })

export const CandidatureLbaModalBody = ({
  isLoading,
  company,
  item,
  kind,
  fromWidget = false,
  onSubmit,
  onClose,
}: {
  isLoading: boolean
  company: string
  item: ILbaItemLbaJobJson | ILbaItemLbaCompanyJson | ILbaItemPartnerJobJson
  kind: LBA_ITEM_TYPE | LBA_ITEM_TYPE_OLD
  fromWidget?: boolean
  onSubmit: (values: IApplicationSchemaInitValues) => void
  onClose: () => void
}) => {
  const formik = useFormik({
    initialValues: getInitialSchemaValues(),
    validationSchema: toFormikValidationSchema(ApplicationFormikSchema),
    onSubmit,
  })

  const setFileValue = (fileValue) => {
    formik.values.applicant_attachment_name = fileValue?.applicant_attachment_name || null
    formik.values.applicant_attachment_content = fileValue?.applicant_attachment_content || null
  }

  const isOffre =
    kind === LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA || kind === LBA_ITEM_TYPE.OFFRES_EMPLOI_PARTENAIRES || kind === LBA_ITEM_TYPE_OLD.MATCHA || kind === LBA_ITEM_TYPE_OLD.PARTNER_JOB

  return (
    <form onSubmit={formik.handleSubmit} style={{ display: "flex", height: "100%", alignItems: "stretch" }}>
      <Box sx={{ display: { xs: "none", sm: "none", md: "none", lg: "block" } }}>
        <CandidatureTasksChecklist kind={kind} />
      </Box>
      <Box sx={{ mx: { xs: 6, sm: 8, md: 8, lg: 8, xl: "69px" }, my: 4 }}>
        {!fromWidget && (
          <>
            <Box sx={{ display: "flex", justifyContent: "flex-end", mr: -6, mb: fr.spacing("2w") }}>
              <ModalCloseButton onClose={onClose} />
            </Box>
          </>
        )}
        <Typography variant="h1" sx={{ fontWeight: 700, fontSize: "24px" }} data-testid="CandidatureSpontaneeTitle">
          {isOffre ? (
            <>
              Postuler à l&apos;offre {fromWidget ? `${item.title} ` : ""}de {company}
            </>
          ) : (
            <>Candidature spontanée{fromWidget ? ` auprès de ${company}` : ""}</>
          )}
        </Typography>

        <CandidatureLbaMessage formik={formik} />
        <Box sx={{ mt: 4 }}>
          <CandidatureLbaFileDropzone formik={formik} setFileValue={setFileValue} />
        </Box>
        <UserFields formik={formik} />

        <Box sx={{ mt: 4 }}>
          <CandidatureLbaMandataireMessage item={item} />
        </Box>

        <Box sx={{ my: 4 }}>
          <Typography sx={{ mb: 2, fontSize: "14px", color: "grey.600" }}>* Champs obligatoires</Typography>
          <Typography>
            En remplissant ce formulaire, vous acceptez les{" "}
            <DsfrLink href="/conditions-generales-utilisation" aria-description="Conditions générales d'utilisation - nouvelle fenêtre" external>
              Conditions générales d&apos;utilisation
            </DsfrLink>{" "}
            du service La bonne alternance et acceptez le partage de vos informations avec l&apos;établissement {company}.
            <br />
            Pour plus d'informations sur le traitement de vos données à caractère personnel, veuillez consulter la{" "}
            <DsfrLink href="/politique-de-confidentialite" aria-description="politique de confidentialité - nouvelle fenêtre" external>
              Politique de confidentialité
            </DsfrLink>{" "}
            de La bonne alternance.
          </Typography>
        </Box>

        <InfoBanner showInfo={false} showAlert={false} showOK={false} forceEnvBanner={true} />
        <Box sx={{ display: "flex", my: 4, justifyContent: "flex-end" }}>
          {isLoading ? (
            <Box sx={{ display: "flex", alignItems: "center", flexDirection: "row" }} data-testid="candidature-currently-sending">
              <CircularProgress sx={{ mr: 4 }} />
              <Typography>Veuillez patienter</Typography>
            </Box>
          ) : isOffre ? (
            <Button data-tracking-id="postuler-offre-lba" aria-label="Envoyer la candidature" type="submit" data-testid="candidature-not-sent">
              J'envoie ma candidature
            </Button>
          ) : (
            <Button data-tracking-id="postuler-entreprise-algo" aria-label="Envoyer la candidature spontanée" type="submit" data-testid="candidature-not-sent">
              J'envoie ma candidature spontanée
            </Button>
          )}
        </Box>
      </Box>
    </form>
  )
}

const UserFields = ({ formik }: { formik: any }) => {
  const [suggestedEmails, setSuggestedEmails] = useState<Result[]>([])

  const onEmailChange = (e: ChangeEvent<HTMLInputElement>) => {
    const checkedEmail = emailChecker(e.target.value)
    setSuggestedEmails(checkedEmail)
    formik.handleChange(e)
  }

  const clickSuggestion = (value: string) => {
    formik.setFieldValue("applicant_email", value)
    setSuggestedEmails([])
  }

  return (
    <Grid container spacing={2} sx={{ mt: 4 }}>
      <Grid size={{ xs: 12, md: 6 }}>
        <FormControl error={formik.touched.applicant_last_name && Boolean(formik.errors.applicant_last_name)} fullWidth>
          <FormLabel required>Nom</FormLabel>
          <Input
            fullWidth={true}
            data-testid="lastName"
            id="lastName"
            name="applicant_last_name"
            type="text"
            error={formik.touched.applicant_last_name && Boolean(formik.errors.applicant_last_name)}
            value={formik.values.applicant_last_name}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            className={fr.cx("fr-input")}
          />
          <FormHelperText>{formik.touched.applicant_last_name && formik.errors.applicant_last_name}</FormHelperText>
        </FormControl>
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <FormControl error={formik.touched.applicant_first_name && Boolean(formik.errors.applicant_first_name)} fullWidth>
          <FormLabel required>Prénom</FormLabel>
          <Input
            className={fr.cx("fr-input")}
            data-testid="firstName"
            id="firstName"
            name="applicant_first_name"
            type="text"
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            value={formik.values.applicant_first_name}
          />
          <FormHelperText>{formik.touched.applicant_first_name && formik.errors.applicant_first_name}</FormHelperText>
        </FormControl>
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <FormControl error={formik.touched.applicant_email && Boolean(formik.errors.applicant_email)} fullWidth>
          <FormLabel required>E-mail</FormLabel>
          <Input
            fullWidth={true}
            className={fr.cx("fr-input")}
            data-testid="email"
            id="email"
            name="applicant_email"
            type="email"
            onChange={onEmailChange}
            onBlur={formik.handleBlur}
            value={formik.values.applicant_email}
          />
          {suggestedEmails.length > 0 && (
            <Box sx={{ mt: 2, fontSize: "12px", color: "grey.600" }}>
              <Typography component="span" sx={{ mr: 2 }}>
                Voulez vous dire ?
              </Typography>
              {suggestedEmails.map((suggestedEmail) => (
                <Button key={suggestedEmail.corrected} onClick={() => clickSuggestion(suggestedEmail.corrected)} priority="tertiary no outline" size="small">
                  {suggestedEmail.corrected}
                </Button>
              ))}
            </Box>
          )}
          <FormHelperText>{formik.touched.applicant_email && formik.errors.applicant_email}</FormHelperText>
        </FormControl>
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <FormControl error={formik.touched.applicant_phone && Boolean(formik.errors.applicant_phone)} fullWidth>
          <FormLabel required>Téléphone</FormLabel>
          <Input
            className={fr.cx("fr-input")}
            data-testid="phone"
            id="phone"
            name="applicant_phone"
            type="tel"
            fullWidth
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            value={formik.values.applicant_phone}
            sx={{ mt: { xs: 3, md: 0 } }}
          />
          <FormHelperText>{formik.touched.applicant_phone && formik.errors.applicant_phone}</FormHelperText>
        </FormControl>
      </Grid>
    </Grid>
  )
}
