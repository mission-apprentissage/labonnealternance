import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import {
  Box,
  Input,
  Typography,
  FormControl,
  FormLabel,
  FormHelperText,
  RadioGroup,
  FormControlLabel,
  Radio,
  Select,
  MenuItem,
  ListItemText,
  SelectChangeEvent,
  Checkbox,
} from "@mui/material"
import emailMisspelled, { top100 } from "email-misspelled"
import { Formik, useField } from "formik"
import { useState } from "react"
import { EReasonsKey } from "shared"
import { EApplicantType } from "shared/constants/rdva"
import * as Yup from "yup"

import { DsfrLink } from "@/components/dsfr/DsfrLink"
import { RdvReasons } from "@/components/RDV/RdvReasons"
import { apiPost } from "@/utils/api.utils"
import { SendPlausibleEvent } from "@/utils/plausible"

import InfoBanner from "../InfoBanner/InfoBanner"

const emailChecker = emailMisspelled({ maxMisspelled: 3, domains: top100 })

export const DemandeDeContactForm = ({
  context: { cle_ministere_educatif, etablissement_formateur_entreprise_raison_sociale },
  referrer,
  onRdvSuccess,
}: {
  context: { cle_ministere_educatif: string; etablissement_formateur_entreprise_raison_sociale: string }
  referrer: string
  onRdvSuccess: (props: { appointmentId: string; token: string }) => void
}) => {
  const [error, setError] = useState<string | null>(null)

  return (
    <Formik
      initialValues={{
        firstname: "",
        lastname: "",
        phone: "",
        email: "",
        applicantMessageToCfa: "",
        applicantType: EApplicantType.ETUDIANT,
        applicantReasons: [],
      }}
      validationSchema={Yup.object({
        firstname: Yup.string().required("⚠ Le prénom est obligatoire"),
        lastname: Yup.string().required("⚠ Le nom est obligatoire"),
        phone: Yup.string()
          .matches(/^[0-9]{10}$/, "⚠ Numéro de téléphone invalide")
          .required("⚠ Le numéro de téléphone est obligatoire"),
        email: Yup.string().email("⚠ Adresse e-mail invalide").required("⚠ L'adresse e-mail est obligatoire"),
        applicantMessageToCfa: Yup.string(),
        applicantType: Yup.mixed().oneOf(Object.values(EApplicantType)),
        applicantReasons: Yup.array(Yup.mixed().oneOf(RdvReasons.map((item) => item.key)))
          .min(1, "Le(s) sujet(s) que je souhaite aborder doit/doivent être renseigné(s).")
          .required("Le(s) sujet(s) que je souhaite aborder doit/doivent être renseigné(s)."),
      })}
      onSubmit={async (values) => {
        try {
          const result = await apiPost("/appointment-request/validate", {
            body: {
              firstname: values.firstname,
              lastname: values.lastname,
              phone: values.phone,
              email: values.email,
              type: values.applicantType,
              applicantMessageToCfa: values.applicantMessageToCfa,
              cleMinistereEducatif: cle_ministere_educatif,
              applicantReasons: values.applicantReasons,
              appointmentOrigin: referrer,
            },
          })
          const appointmentId = result?.appointment?._id?.toString()
          const token = result?.token
          if (!appointmentId || !token) {
            setError("Une erreur inattendue est survenue.")
            return
          }
          onRdvSuccess({ appointmentId, token })
          SendPlausibleEvent("Envoi Prendre RDV - Fiche formation", {
            info_fiche: `${cle_ministere_educatif}`,
          })
        } catch (json: any) {
          setError(json?.message || "Une erreur inattendue est survenue.")
        }
      }}
    >
      {(formik) => {
        return (
          <form onSubmit={formik.handleSubmit}>
            <FormControl>
              <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, alignItems: { xs: "flex-start", md: "center" }, mb: fr.spacing("2w") }}>
                <Typography sx={{ mr: { xs: 0, md: 3 }, mb: { xs: 1, sm: 1, md: 0 } }}>Vous êtes * :</Typography>
                <RadioGroup row data-testid="fieldset-who-type" value={formik.values.applicantType} onChange={(_, value) => formik.setFieldValue("applicantType", value)}>
                  <FormControlLabel value={EApplicantType.ETUDIANT} label="L'étudiant" control={<Radio />} />
                  <FormControlLabel value={EApplicantType.PARENT} label="Le parent" control={<Radio />} />
                </RadioGroup>
              </Box>
            </FormControl>
            <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, gap: 2, mb: fr.spacing("2w") }}>
              <FormControl data-testid="fieldset-lastname" error={formik.touched.lastname && Boolean(formik.errors.lastname)} fullWidth>
                <FormLabel htmlFor="lastname">Nom *</FormLabel>
                <Input
                  className={fr.cx("fr-input")}
                  data-testid="lastname"
                  name="lastname"
                  type="text"
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  value={formik.values.lastname}
                />
                <FormHelperText>{formik.touched.lastname && formik.errors.lastname}</FormHelperText>
              </FormControl>
              <FormControl data-testid="fieldset-firstname" error={formik.touched.firstname && Boolean(formik.errors.firstname)} fullWidth>
                <FormLabel htmlFor="firstname">Prénom *</FormLabel>
                <Input
                  className={fr.cx("fr-input")}
                  data-testid="firstname"
                  name="firstname"
                  type="text"
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  value={formik.values.firstname}
                />
                <FormHelperText>{formik.touched.firstname && formik.errors.firstname}</FormHelperText>
              </FormControl>
            </Box>
            <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, gap: 2, mb: fr.spacing("2w") }}>
              <EmailField />
              <FormControl data-testid="fieldset-phone" error={formik.touched.phone && Boolean(formik.errors.phone)} fullWidth>
                <FormLabel htmlFor="email">Téléphone *</FormLabel>
                <Input
                  className={fr.cx("fr-input")}
                  data-testid="phone"
                  name="phone"
                  type="phone"
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  value={formik.values.phone}
                />
                <FormHelperText>{formik.touched.phone && formik.errors.phone}</FormHelperText>
              </FormControl>
            </Box>
            <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, mb: fr.spacing("2w") }}>
              <ReasonsField formik={formik} />
            </Box>
            <Box width="95%" fontSize="12px">
              <Typography sx={{ mb: fr.spacing("2w") }} color="grey.600">
                * Champs obligatoires
              </Typography>
              <Typography sx={{ mb: fr.spacing("2w") }}>
                En remplissant ce formulaire, vous acceptez les{" "}
                <DsfrLink href="/conditions-generales-utilisation" external aria-description="Conditions générales d'utilisation - nouvelle fenêtre">
                  Conditions générales d&apos;utilisation
                </DsfrLink>{" "}
                du service La bonne alternance et acceptez le partage de vos informations avec l&apos;établissement {etablissement_formateur_entreprise_raison_sociale}.
                <br />
                Pour plus d'informations sur le traitement de vos données à caractère personnel, veuillez consulter la{" "}
                <DsfrLink href="/politique-de-confidentialite" external aria-description="politique de confidentialité - nouvelle fenêtre">
                  Politique de confidentialité
                </DsfrLink>{" "}
                de La bonne alternance.
              </Typography>
            </Box>
            {error && (
              <Box pt={4}>
                <Typography data-testid="prdv-submit-error" color="redmarianne">
                  {error}
                </Typography>
              </Box>
            )}
            <InfoBanner showInfo={false} showAlert={false} showOK={false} forceEnvBanner={true} />
            <Box textAlign="right">
              <Button data-tracking-id="prendre-rdv-cfa" aria-label="Envoyer la demande de contact" type="submit" disabled={formik.isSubmitting}>
                J'envoie ma demande
              </Button>
            </Box>
          </form>
        )
      }}
    </Formik>
  )
}

const EmailField = () => {
  const [suggestedEmails, setSuggestedEmails] = useState([])
  const [field, meta, helper] = useField("email")

  /**
   * On email change, check if email is correct and set suggestion if not.
   */
  const onEmailChange = (e) => {
    const suggestedEmails = emailChecker(e.target.value)
    setSuggestedEmails(suggestedEmails)
    field.onChange(e)
  }

  /**
   * Set email value from suggestion.
   */
  const onClickEmailSuggestion = (e) => {
    helper.setValue(e.currentTarget.innerHTML, true)
    setSuggestedEmails([])
  }

  return (
    <FormControl data-testid="fieldset-email" error={!!(meta.touched && meta.error)} fullWidth>
      <FormLabel htmlFor="email">E-mail *</FormLabel>
      <Input className={fr.cx("fr-input")} data-testid="email" name="email" type="email" onChange={onEmailChange} onBlur={field.onBlur} value={field.value} />
      {suggestedEmails.length > 0 && (
        <Box mt={2} fontSize="12px" color="grey.600">
          <Typography component="span" mr={2}>
            Voulez vous dire ?
          </Typography>
          {suggestedEmails.map((suggestedEmail) => (
            <Button type="button" key={suggestedEmail.corrected} onClick={onClickEmailSuggestion} priority="tertiary no outline" size="small">
              {suggestedEmail.corrected}
            </Button>
          ))}
        </Box>
      )}
      <FormHelperText>{meta.touched && meta.error}</FormHelperText>
    </FormControl>
  )
}

const ReasonsField = ({ formik }: { formik: any }) => {
  const [field, meta, helper] = useField("applicantReasons")
  const applicantReasons: EReasonsKey[] = field.value || []

  /**
   * On change on applicant reasons, it updates the state.
   */
  const onChangeApplicantReasons = (event: SelectChangeEvent<EReasonsKey[]>) => {
    const {
      target: { value },
    } = event
    helper.setValue(typeof value === "string" ? value.split(",") : value, true)
  }

  return (
    <FormControl data-testid="fieldset-reasons" error={meta.touched && Boolean(meta.error)} fullWidth>
      <FormLabel htmlFor="reasons">Quel(s) sujet(s) souhaitez-vous aborder ? *</FormLabel>
      <Select
        multiple
        value={field.value}
        onChange={onChangeApplicantReasons}
        renderValue={(selected) => {
          const selectedReasons = RdvReasons.filter((reason) => selected.includes(reason.key))
          return selectedReasons.map((reason) => reason.title).join(", ")
        }}
        input={<Input className={fr.cx("fr-input")} />}
      >
        {RdvReasons.map(({ key, title }, index) => {
          const checked = applicantReasons.includes(key)
          return (
            <MenuItem key={key} value={key} id={`reason-${index}`}>
              <Checkbox checked={checked} />
              <ListItemText primary={title} />
            </MenuItem>
          )
        })}
      </Select>
      {applicantReasons.includes(EReasonsKey.AUTRE) && (
        <Box sx={{ mt: fr.spacing("2w") }}>
          <FormControl data-testid="fieldset-applicantMessageToCfa" fullWidth>
            <FormLabel htmlFor="reasons">Autre(s) sujet(s) à aborder :</FormLabel>
            <Input
              id="applicantMessageToCfa"
              data-testid="applicantMessageToCfa"
              name="applicantMessageToCfa"
              type="text"
              fullWidth
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              value={formik.values.applicantMessageToCfa}
              className={fr.cx("fr-input")}
            />
          </FormControl>
        </Box>
      )}
      <FormHelperText>{meta.touched && meta.error}</FormHelperText>
    </FormControl>
  )
}
