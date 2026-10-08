import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import { Box, Checkbox, FormControl, FormControlLabel, FormHelperText, FormLabel, Input, Radio, RadioGroup, Typography } from "@mui/material"
import emailMisspelled, { top100 } from "email-misspelled"
import { Formik, useField } from "formik"
import { useEffect, useRef, useState } from "react"
import { EReasonsKey } from "shared"
import { EApplicantType } from "shared/constants/rdva"
import * as Yup from "yup"
import { LiveStatus } from "@/app/_components/LiveStatus"
import { createSubmitWithFocusOnError } from "@/app/_components/submit-with-focus-on-error"
import { DsfrLink } from "@/components/dsfr/DsfrLink"
import InfoBanner from "@/components/InfoBanner/InfoBanner"
import { apiPost } from "@/utils/api.utils"
import { SendPlausibleEvent } from "@/utils/plausible"
import { RdvReasons } from "./rdv-reasons"

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
  const formRef = useRef<HTMLFormElement>(null)

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
      validateOnChange={false}
      validateOnBlur={true}
      validationSchema={Yup.object({
        firstname: Yup.string().required("Le prénom est obligatoire"),
        lastname: Yup.string().required("Le nom est obligatoire"),
        phone: Yup.string()
          .matches(/^[0-9]{10}$/, "Le numéro doit comporter 10 chiffres, par exemple 0612345678")
          .required("Le numéro de téléphone est obligatoire"),
        email: Yup.string().email("Format attendu : nom@domaine.fr").required("L'adresse e-mail est obligatoire"),
        applicantMessageToCfa: Yup.string(),
        applicantType: Yup.mixed().oneOf(Object.values(EApplicantType)),
        applicantReasons: Yup.array(Yup.mixed().oneOf(RdvReasons.map((item) => item.key)))
          .min(1, "Veuillez sélectionner au moins un sujet pour envoyer votre message au CFA.")
          .required("Veuillez sélectionner au moins un sujet pour envoyer votre message au CFA."),
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
        const lastnameError = formik.touched.lastname && formik.errors.lastname
        const firstnameError = formik.touched.firstname && formik.errors.firstname
        const phoneError = formik.touched.phone && formik.errors.phone

        return (
          <form ref={formRef} noValidate onSubmit={createSubmitWithFocusOnError(formRef, formik)}>
            <Typography sx={{ fontSize: "14px", lineHeight: "24px", color: fr.colors.decisions.text.mention.grey.default, mb: fr.spacing("6v") }}>
              Tous les champs sont obligatoires.
            </Typography>
            <FormControl
              component="fieldset"
              sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, alignItems: { xs: "flex-start", md: "center" }, mb: fr.spacing("4v") }}
            >
              {/* float : une légende flottante n'est plus sortie du flux par le navigateur, elle reste alignée avec les radios */}
              <Typography component="legend" sx={{ float: "left", p: 0, mr: { xs: 0, md: fr.spacing("2v") }, mb: { xs: fr.spacing("2v"), sm: fr.spacing("2v"), md: 0 } }}>
                Vous êtes :
              </Typography>
              <RadioGroup
                row
                name="applicantType"
                data-testid="fieldset-who-type"
                value={formik.values.applicantType}
                onChange={async (_, value) => formik.setFieldValue("applicantType", value)}
              >
                <FormControlLabel htmlFor="applicantType-etudiant" value={EApplicantType.ETUDIANT} label="L'étudiant" control={<Radio id="applicantType-etudiant" />} />
                <FormControlLabel htmlFor="applicantType-parent" value={EApplicantType.PARENT} label="Le parent" control={<Radio id="applicantType-parent" />} />
              </RadioGroup>
            </FormControl>
            <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, gap: fr.spacing("4v"), mb: fr.spacing("4v") }}>
              <FormControl data-testid="fieldset-lastname" error={Boolean(lastnameError)} fullWidth>
                <FormLabel htmlFor="lastname">Nom</FormLabel>
                <Input
                  className={fr.cx("fr-input")}
                  data-testid="lastname"
                  id="lastname"
                  name="lastname"
                  type="text"
                  autoComplete="family-name"
                  aria-describedby={describedBy(lastnameError && "lastname-error")}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  value={formik.values.lastname}
                />
                <FormHelperText id="lastname-error">{lastnameError}</FormHelperText>
              </FormControl>
              <FormControl data-testid="fieldset-firstname" error={Boolean(firstnameError)} fullWidth>
                <FormLabel htmlFor="firstname">Prénom</FormLabel>
                <Input
                  className={fr.cx("fr-input")}
                  data-testid="firstname"
                  id="firstname"
                  name="firstname"
                  type="text"
                  autoComplete="given-name"
                  aria-describedby={describedBy(firstnameError && "firstname-error")}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  value={formik.values.firstname}
                />
                <FormHelperText id="firstname-error">{firstnameError}</FormHelperText>
              </FormControl>
            </Box>
            <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, gap: fr.spacing("4v"), mb: fr.spacing("4v") }}>
              <EmailField />
              <FormControl data-testid="fieldset-phone" error={Boolean(phoneError)} fullWidth>
                <FormLabel htmlFor="phone">Téléphone</FormLabel>
                <HintText id="phone-hint">10 chiffres, par exemple 0612345678</HintText>
                <Input
                  className={fr.cx("fr-input")}
                  data-testid="phone"
                  id="phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel-national"
                  aria-describedby={describedBy("phone-hint", phoneError && "phone-error")}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  value={formik.values.phone}
                />
                <FormHelperText id="phone-error">{phoneError}</FormHelperText>
              </FormControl>
            </Box>
            <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, mb: fr.spacing("4v") }}>
              <ReasonsField formik={formik} />
            </Box>
            <Box sx={{ width: "95%" }}>
              <Typography variant="body2" sx={{ mb: fr.spacing("4v") }}>
                En remplissant ce formulaire, vous acceptez les{" "}
                <DsfrLink href="/conditions-generales-utilisation" external>
                  Conditions générales d&apos;utilisation
                </DsfrLink>{" "}
                du service La bonne alternance et acceptez le partage de vos informations avec l&apos;établissement {etablissement_formateur_entreprise_raison_sociale}.
                <br />
                Pour plus d'informations sur le traitement de vos données à caractère personnel, veuillez consulter la{" "}
                <DsfrLink href="/politique-de-confidentialite" external>
                  Politique de confidentialité
                </DsfrLink>{" "}
                de La bonne alternance.
              </Typography>
            </Box>
            {error && (
              <Box
                sx={{
                  pt: fr.spacing("8v"),
                }}
              >
                <Typography data-testid="prdv-submit-error" role="alert" color="redmarianne">
                  {error}
                </Typography>
              </Box>
            )}
            <InfoBanner showInfo={false} showAlert={false} showOK={false} forceEnvBanner={true} />
            <Box
              sx={{
                textAlign: "right",
              }}
            >
              <Button data-tracking-id="prendre-rdv-cfa" type="submit" disabled={formik.isSubmitting}>
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
  const emailDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const emailInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    return () => {
      if (emailDebounceRef.current) clearTimeout(emailDebounceRef.current)
    }
  }, [])

  const onEmailChange = (e) => {
    field.onChange(e)
    const value = e.target.value
    if (emailDebounceRef.current) clearTimeout(emailDebounceRef.current)
    emailDebounceRef.current = setTimeout(() => {
      setSuggestedEmails(emailChecker(value))
    }, 300)
  }

  const onClickEmailSuggestion = (e) => {
    helper.setValue(e.currentTarget.innerHTML, true)
    setSuggestedEmails([])
    // cf. clickSuggestion dans CandidatureLbaModalBody
    emailInputRef.current?.focus()
  }

  const displayedError = meta.touched && meta.error

  return (
    <FormControl data-testid="fieldset-email" error={Boolean(displayedError)} fullWidth>
      <FormLabel htmlFor="email">E-mail</FormLabel>
      <HintText id="email-hint">Format attendu : nom@domaine.fr</HintText>
      <Input
        className={fr.cx("fr-input")}
        data-testid="email"
        inputRef={emailInputRef}
        id="email"
        name="email"
        type="email"
        autoComplete="email"
        aria-describedby={describedBy("email-hint", displayedError && "email-error")}
        onChange={onEmailChange}
        onBlur={field.onBlur}
        value={field.value}
      />
      {suggestedEmails.length > 0 && (
        <Box
          sx={{
            mt: fr.spacing("4v"),
            fontSize: "12px",
            color: fr.colors.decisions.text.mention.grey.default,
          }}
        >
          <Typography
            component="span"
            sx={{
              mr: fr.spacing("4v"),
            }}
          >
            Voulez-vous dire ?
          </Typography>
          {suggestedEmails.map((suggestedEmail) => (
            <Button type="button" key={suggestedEmail.corrected} onClick={onClickEmailSuggestion} priority="tertiary no outline" size="small">
              {suggestedEmail.corrected}
            </Button>
          ))}
        </Box>
      )}
      <LiveStatus message={suggestedEmails.length > 0 ? `Voulez-vous dire ${suggestedEmails.map(({ corrected }) => corrected).join(" ou ")} ?` : ""} />
      <FormHelperText id="email-error">{displayedError}</FormHelperText>
    </FormControl>
  )
}

const ReasonsField = ({ formik }: { formik: any }) => {
  const [field, meta, helper] = useField("applicantReasons")
  const applicantReasons: EReasonsKey[] = field.value || []

  const onChangeApplicantReasons = (reasonKey: EReasonsKey, checked: boolean) => {
    const updatedReasons = checked ? [...applicantReasons, reasonKey] : applicantReasons.filter((key) => key !== reasonKey)
    helper.setValue(updatedReasons, true)
  }

  const displayedError = meta.touched && meta.error

  return (
    <Box sx={{ width: "100%" }}>
      <FormControl
        component="fieldset"
        data-testid="fieldset-reasons"
        error={Boolean(displayedError)}
        aria-describedby={describedBy(displayedError && "applicantReasons-error")}
        fullWidth
      >
        <FormLabel component="legend" sx={{ p: 0 }}>
          Quel(s) sujet(s) souhaitez-vous aborder ?
        </FormLabel>
        <Box sx={{ display: "flex", flexDirection: "column", mt: fr.spacing("2v") }}>
          {RdvReasons.map(({ key, title }, index) => {
            const checked = applicantReasons.includes(key)
            return (
              <FormControlLabel
                key={key}
                htmlFor={`reason-${index}`}
                control={<Checkbox checked={checked} onChange={(e) => onChangeApplicantReasons(key, e.target.checked)} id={`reason-${index}`} name="applicantReasons" />}
                label={title}
              />
            )
          })}
        </Box>
        <FormHelperText id="applicantReasons-error">{displayedError}</FormHelperText>
      </FormControl>
      {applicantReasons.includes(EReasonsKey.AUTRE) && (
        <Box sx={{ mt: fr.spacing("4v") }}>
          <FormControl data-testid="fieldset-applicantMessageToCfa" fullWidth>
            <FormLabel htmlFor="applicantMessageToCfa">Autre(s) sujet(s) à aborder (facultatif) :</FormLabel>
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
    </Box>
  )
}

const describedBy = (...ids: (string | false | undefined)[]) => ids.filter(Boolean).join(" ") || undefined

const HintText = ({ id, children }: { id: string; children: React.ReactNode }) => (
  <Typography id={id} sx={{ mb: fr.spacing("1v"), fontSize: "12px", lineHeight: "20px", color: fr.colors.decisions.text.mention.grey.default }}>
    {children}
  </Typography>
)
