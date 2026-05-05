import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import RadioButtons from "@codegouvfr/react-dsfr/RadioButtons"
import { Box, CircularProgress, FormControl, FormHelperText, FormLabel, Input, type InputProps, TextareaAutosize, Typography } from "@mui/material"
import dayjs from "dayjs"
import type { Result } from "email-misspelled"
import emailMisspelled, { top100 } from "email-misspelled"
import { useFormik } from "formik"
import type { ChangeEvent } from "react"
import { useState } from "react"
import type { ILbaItemLbaCompanyJson, ILbaItemLbaJobJson, ILbaItemPartnerJobJson } from "shared"
import { LBA_ITEM_TYPE, LBA_ITEM_TYPE_OLD } from "shared/constants/lbaitem"
import { toFormikValidationSchema } from "zod-formik-adapter"
import { MultiSelectField } from "@/app/_components/FormComponents/MultiSelectField"
import { SelectField } from "@/app/_components/FormComponents/SelectField"
import ModalCloseButton from "@/app/_components/ModalCloseButton"
import { DsfrLink } from "@/components/dsfr/DsfrLink"
import InfoBanner from "@/components/InfoBanner/InfoBanner"
import { CandidatureLbaFileDropzone } from "./CandidatureLbaFileDropzone"
import CandidatureLbaMandataireMessage from "./CandidatureLbaMandataireMessage"
import type { IApplicationSchemaInitValues } from "./services/getSchema"
import { ApplicationFormikSchema, getInitialSchemaValues } from "./services/getSchema"

const emailChecker = emailMisspelled({ maxMisspelled: 3, domains: top100 })

type FormikType = ReturnType<typeof useFormik>

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

  const isOffre =
    kind === LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA || kind === LBA_ITEM_TYPE.OFFRES_EMPLOI_PARTENAIRES || kind === LBA_ITEM_TYPE_OLD.MATCHA || kind === LBA_ITEM_TYPE_OLD.PARTNER_JOB

  return (
    <form onSubmit={formik.handleSubmit} style={{ position: "relative" }}>
      <Box sx={{ margin: { xs: fr.spacing("4v"), md: fr.spacing("6v") }, mb: 0 }}>
        {!fromWidget && (
          <>
            <Box sx={{ display: "flex", justifyContent: "flex-end", mr: -6, mb: fr.spacing("4v") }}>
              <ModalCloseButton onClose={onClose} />
            </Box>
          </>
        )}
        <Typography variant="h1" sx={{ fontWeight: 700, fontSize: "32px", mb: fr.spacing("6v") }} data-testid="CandidatureSpontaneeTitle">
          {isOffre ? (
            <>
              Postuler à l&apos;offre {fromWidget ? `${item.title} ` : ""}de {company}
            </>
          ) : (
            <>Candidature spontanée{fromWidget ? ` auprès de ${company}` : ""}</>
          )}
        </Typography>

        <Typography sx={{ mb: 2, fontSize: "14px", color: "grey.600", my: fr.spacing("2v") }}>Les champs marqués d’un astérisque (*) sont obligatoires.</Typography>

        <Box sx={{ pt: fr.spacing("8v"), display: "flex", gap: fr.spacing("6v"), flexDirection: { xs: "column", md: "row" } }}>
          <Box
            sx={(theme) => ({
              height: "fit-content",
              [theme.breakpoints.up("xs")]: {},
              [theme.breakpoints.up("md")]: {
                backgroundColor: "#F6F6F6",
                width: 484,
                px: fr.spacing("6v"),
                py: fr.spacing("8v"),
              },
            })}
          >
            <MesInformations formik={formik} />
            <MaRechercheDAlternance formik={formik} />
          </Box>
          <Box sx={{ flex: 1, px: fr.spacing("2v"), pt: { sx: 0, md: fr.spacing("2v") } }}>
            <Typography variant="h2" sx={{ fontWeight: 700, fontSize: "24px", lineHeight: "32px", my: fr.spacing("6v") }}>
              Mon message personnalisé
            </Typography>
            <TextareaInput
              formik={formik}
              name="applicant_message"
              label="Message au responsable du recrutement"
              infoText="Un message personnalisé augmente vos chances d'obtenir un contact avec le recruteur."
            />
            <Box sx={{ mt: fr.spacing("4v") }}>
              <CvFileInput formik={formik} />
            </Box>

            <Box sx={{ mt: fr.spacing("8v") }}>
              <CandidatureLbaMandataireMessage item={item} />
            </Box>
          </Box>
        </Box>
      </Box>
      <Box
        sx={(theme) => ({
          padding: fr.spacing("6v"),
          backgroundColor: "white",
          [theme.breakpoints.up("xs")]: {},
          [theme.breakpoints.up("md")]: {
            position: "sticky",
            boxShadow: "0 6px 18px 0 #00001229",
            bottom: 0,
            left: 0,
          },
        })}
      >
        <InfoBanner showInfo={false} showAlert={false} showOK={false} forceEnvBanner={true} />
        <Box sx={{ display: "flex", gap: fr.spacing("6v"), alignItems: { xs: "flex-end", md: "center" }, flexDirection: { xs: "column", md: "row" } }}>
          <Typography
            sx={{
              fontSize: "14px",
              lineHeight: "24px",
              a: {
                fontSize: "14px !important",
              },
            }}
          >
            En remplissant ce formulaire, vous acceptez les{" "}
            <DsfrLink href="/conditions-generales-utilisation" aria-description="Conditions générales d'utilisation - nouvelle fenêtre" external>
              Conditions générales d&apos;utilisation
            </DsfrLink>{" "}
            du service La bonne alternance et acceptez le partage de vos informations avec l&apos;établissement {company}. Pour plus d'informations sur le traitement de vos données
            à caractère personnel, veuillez consulter la{" "}
            <DsfrLink href="/politique-de-confidentialite" aria-description="politique de confidentialité - nouvelle fenêtre" external>
              Politique de confidentialité
            </DsfrLink>{" "}
            de La bonne alternance.
          </Typography>

          {isLoading ? (
            <Box sx={{ display: "flex", alignItems: "center", flexDirection: "row" }} data-testid="candidature-currently-sending">
              <CircularProgress sx={{ mr: fr.spacing("8v") }} />
              <Typography>Veuillez patienter</Typography>
            </Box>
          ) : isOffre ? (
            <Button
              iconId="fr-icon-arrow-right-line"
              iconPosition="left"
              data-tracking-id="postuler-offre-lba"
              aria-label="Envoyer la candidature"
              type="submit"
              data-testid="candidature-not-sent"
              style={{ minWidth: "fit-content" }}
            >
              J'envoie ma candidature
            </Button>
          ) : (
            <Button
              iconId="fr-icon-arrow-right-line"
              iconPosition="left"
              data-tracking-id="postuler-entreprise-algo"
              aria-label="Envoyer la candidature spontanée"
              type="submit"
              data-testid="candidature-not-sent"
              style={{ minWidth: "fit-content" }}
            >
              J'envoie ma candidature spontanée
            </Button>
          )}
        </Box>
      </Box>
    </form>
  )
}

const MesInformations = ({ formik }: { formik: FormikType }) => {
  return (
    <>
      <Typography variant="h2" sx={{ fontWeight: 700, fontSize: "24px", lineHeight: "32px", mb: fr.spacing("6v") }}>
        Mes informations
      </Typography>
      <Box sx={{ display: "flex", flexDirection: "column", gap: fr.spacing("6v") }}>
        <FormikInput name="applicant_last_name" label="Nom" formik={formik} required />
        <FormikInput name="applicant_first_name" label="Prénom" formik={formik} required />
        <EmailInput formik={formik} />
        <FormikInput
          name="applicant_phone"
          label="Téléphone"
          formik={formik}
          required
          inputProps={{
            type: "tel",
            sx: { mt: { xs: 3, md: 0 } },
          }}
        />
      </Box>
    </>
  )
}

const firstCharUppercase = (str: string): string => str.charAt(0).toUpperCase() + str.substring(1)

const MaRechercheDAlternance = ({ formik }: { formik: FormikType }) => {
  const applicant_inscription_formation = formik.values.applicant_inscription_formation as boolean | undefined

  const contractStartLabels = ["Dès que possible", ...new Array(12).fill(0).map((_, monthIndex) => `${firstCharUppercase(dayjs().add(monthIndex, "months").format("MMMM YYYY"))}`)]

  return (
    <>
      <Typography variant="h2" sx={{ fontWeight: 700, fontSize: "24px", lineHeight: "32px", my: fr.spacing("6v") }}>
        Ma recherche d'alternance
      </Typography>
      <Box sx={{ display: "flex", flexDirection: "column", gap: fr.spacing("6v") }}>
        <RadioInput
          formik={formik}
          name="applicant_inscription_formation"
          label="Ma situation"
          options={[
            { label: "Je suis déjà inscrit(e) en formation", value: true },
            { label: "Je ne suis pas encore inscrit(e) en formation", value: false },
          ]}
        />
        {applicant_inscription_formation !== undefined && (
          <>
            <FormikSelect formik={formik} name="applicant_contract_duration" label="Durée du contrat souhaitée" options={[6, 12, 18, 24, 36].map((len) => `${len} mois`)} />
            <MultiSelect name="applicant_contract_start" label="Début de contrat souhaité" formik={formik} options={contractStartLabels} />
          </>
        )}
        {applicant_inscription_formation === true && (
          <>
            <TextareaInput
              formik={formik}
              name="applicant_formation_description"
              label="Informations sur l’école et la formation"
              description="Ex: Nom de l’école / Intitulé de la formation / Ville"
            />
            <TextareaInput
              formik={formik}
              name="applicant_rythm_description"
              label="Rythme de l’alternance (école/entreprise)"
              description="Ex: 1 semaine à l’école / 2 semaines en entreprise"
            />
          </>
        )}
        <InfoText>
          Ces informations aident l’entreprise à étudier votre candidature.{applicant_inscription_formation === true && " La taille des champs est limitée à 200 caractères."}
        </InfoText>
      </Box>
    </>
  )
}

const EmailInput = ({ formik }: { formik: FormikType }) => {
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
    <FormikInput
      formik={formik}
      label="E-mail"
      name="applicant_email"
      required
      inputProps={{
        type: "email",
        onChange: onEmailChange,
      }}
      postInput={
        <>
          {suggestedEmails.length > 0 && (
            <Box sx={{ mt: 2, fontSize: "12px", color: "grey.600" }}>
              <Typography component="span" sx={{ mr: fr.spacing("4v") }}>
                Voulez vous dire ?
              </Typography>
              {suggestedEmails.map((suggestedEmail) => (
                <Button key={suggestedEmail.corrected} onClick={() => clickSuggestion(suggestedEmail.corrected)} priority="tertiary no outline" size="small">
                  {suggestedEmail.corrected}
                </Button>
              ))}
            </Box>
          )}
        </>
      }
    />
  )
}

const FormikInput = ({
  name,
  label,
  required,
  formik,
  inputProps,
  postInput,
}: {
  name: string
  label: string
  required?: boolean
  formik: FormikType
  inputProps?: Partial<InputProps>
  postInput?: React.ReactNode
}) => {
  const value = formik.values[name]
  const touched = formik.touched[name]
  const error = formik.errors[name] as string
  const displayedErrorOpt = touched && error

  return (
    <FormControl error={Boolean(displayedErrorOpt)} fullWidth>
      <FormLabel {...(required ? { required } : {})}>{label}</FormLabel>
      <Input
        fullWidth={true}
        data-testid={name}
        id={name}
        name={name}
        type="text"
        error={Boolean(displayedErrorOpt)}
        value={value}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        className={fr.cx("fr-input")}
        {...inputProps}
      />
      {postInput}
      <FormHelperText>{displayedErrorOpt}</FormHelperText>
    </FormControl>
  )
}

const FormikSelect = ({ formik, name, label, options }: { formik: FormikType; name: string; label: string; options: string[] }) => {
  const value = formik.values[name]
  const touched = formik.touched[name]
  const error = formik.errors[name] as string
  const displayedErrorOpt = touched && error

  return (
    <SelectField
      id={name}
      label={label}
      style={{
        marginBottom: 0,
        textWrap: "nowrap",
      }}
      options={options.map((option) => ({ value: option, label: option, selected: option === value }))}
      nativeSelectProps={{
        value: value ?? undefined,
        onChange: (event) => {
          const { value } = event.target
          const option = options.find((option) => option === value)
          formik.setFieldValue(name, option, true)
        },
        style: {
          fontWeight: 700,
        },
      }}
      state={displayedErrorOpt ? "error" : "default"}
      stateRelatedMessage={displayedErrorOpt}
    />
  )
}

const CvFileInput = ({ formik }: { formik: FormikType }) => {
  const setFileValue = (fileValue) => {
    formik.setFieldValue("applicant_attachment_name", fileValue?.applicant_attachment_name || null)
    formik.setFieldValue("applicant_attachment_content", fileValue?.applicant_attachment_content || null)
  }

  return <CandidatureLbaFileDropzone formik={formik} setFileValue={setFileValue} />
}

const TextareaInput = ({
  formik,
  name,
  label,
  required,
  description,
  infoText,
}: {
  formik: FormikType
  name: string
  label: string
  required?: boolean
  description?: string
  infoText?: string
}) => {
  const value = formik.values[name]
  const touched = formik.touched[name]
  const error = formik.errors[name] as string
  const displayedErrorOpt = touched && error

  return (
    <FormControl error={Boolean(displayedErrorOpt)} fullWidth>
      <FormLabel sx={{ mb: fr.spacing("1v"), fontSize: "16px", lineHeight: "24px" }} {...(required ? { required } : {})}>
        {label}
      </FormLabel>
      {Boolean(description) && <FormLabel sx={{ mb: fr.spacing("1v"), fontSize: "12px", lineHeight: "20px", color: "grey.600" }}>{description}</FormLabel>}
      <TextareaAutosize
        style={{
          marginTop: fr.spacing("2v"),
          ...(displayedErrorOpt ? { borderColor: "#ce0500" } : {}),
        }}
        className={fr.cx("fr-input")}
        id={name}
        data-testid={name}
        name={name}
        onBlur={formik.handleBlur}
        onChange={formik.handleChange}
        value={value}
      />
      <FormHelperText>{displayedErrorOpt}</FormHelperText>
      {Boolean(infoText) && (
        <Box sx={{ mt: fr.spacing("6v") }}>
          <InfoText>{infoText}</InfoText>
        </Box>
      )}
    </FormControl>
  )
}

const RadioInput = <T extends { label: string; value: any }>({
  formik,
  name,
  options,
  label,
  infoText,
}: {
  formik: FormikType
  name: string
  options: T[]
  label: string
  infoText?: string
}) => {
  const value = formik.values[name]
  const touched = formik.touched[name]
  const error = formik.errors[name] as string
  const displayedErrorOpt = touched && error

  return (
    <Box>
      <RadioButtons
        style={{
          marginBottom: 0,
        }}
        name={name}
        legend={label}
        options={options.map((option) => ({
          label: option.label,
          nativeInputProps: {
            checked: value === option.value,
            onChange: () => {
              formik.setFieldValue(name, option.value, true)
            },
          },
        }))}
        state={displayedErrorOpt ? "error" : "default"}
        stateRelatedMessage={displayedErrorOpt ? `${error}` : undefined}
      />
      <InfoText>{infoText}</InfoText>
    </Box>
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

const MultiSelect = ({ formik, name, label, options }: { formik: FormikType; name: string; label: string; options: string[] }) => {
  const value = formik.values[name] || []

  return (
    <MultiSelectField
      id={name}
      label={label}
      options={options.map((label) => ({ value: label, label }))}
      value={value}
      onChange={() => undefined}
      onConfirm={(newValue) => {
        formik.setFieldValue(name, newValue, true)
      }}
      onOpen={() => undefined}
      getLabel={(selected) => (selected.length ? selected.map((option) => option.label).join(", ") : "Sélectionner une ou plusieurs options")}
      popperSx={{ width: "425px", maxWidth: { xs: "100%", md: "512px" } }}
    />
  )
}
