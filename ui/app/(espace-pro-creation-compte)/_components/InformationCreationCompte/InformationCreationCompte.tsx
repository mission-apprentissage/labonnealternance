"use client"

import { fr } from "@codegouvfr/react-dsfr"
import Alert from "@codegouvfr/react-dsfr/Alert"
import Button from "@codegouvfr/react-dsfr/Button"
import { Box, CircularProgress, Typography } from "@mui/material"
import { useQuery } from "@tanstack/react-query"
import { Formik, useFormikContext } from "formik"
import parse from "html-react-parser"
import { useRouter } from "next/navigation"
import { useContext, useEffect, useRef, useState } from "react"
import { assertUnreachable, parseEnum } from "shared"
import { BusinessErrorCodes } from "shared/constants/error-codes"
import type { CFA, ENTREPRISE } from "shared/constants/recruteur"
import { OPCOS_LABEL } from "shared/constants/recruteur"
import type { HandiEngagement } from "shared/models/referentiel-engagement-entreprise.model"
import { HANDI_ENGAGEMENT_VALUES } from "shared/models/referentiel-engagement-entreprise.model"
import * as Yup from "yup"
import { ContactInfoFields } from "@/app/_components/ContactInfoFields"
import { AccountFormHeading, FormSection } from "@/app/_components/FormSection"
import { createSubmitWithFocusOnError, useServerFieldErrors } from "@/app/_components/submit-with-focus-on-error"
import { TwoColumnFormLayout } from "@/app/_components/TwoColumnFormLayout"
import { OpcoSection } from "@/app/(espace-pro-creation-compte)/_components/OpcoSection"
import { HandiEngagementSection } from "@/app/(espace-pro)/_components/HandiEngagementSection"
import LoadingEmptySpace from "@/app/(espace-pro)/_components/LoadingEmptySpace"
import InformationLegaleEntreprise from "@/app/(espace-pro)/espace-pro/(connected)/_components/InformationLegaleEntreprise"
import { useHandiEngagementState } from "@/app/hooks/use-handi-engagement-state"
import { AUTHTYPE } from "@/common/contants"
import { emailValidation, frenchPhoneValidation, personNameValidation, toSubmittedPhone } from "@/common/validation/field-validations"
import { AnimationContainer } from "@/components/espace_pro/index"
import { WidgetContext } from "@/context/contextWidget"
import { getEntrepriseOpco } from "@/utils/api"
import { ApiError, apiPost } from "@/utils/api.utils"
import { PAGES } from "@/utils/routes.utils"

/**
 * Synchronise values.handiEngagement avec l'état dérivé de get-entreprise (masqué/verrouillé), qui ne
 * peut être connu qu'après résolution de la requête, donc après le montage initial de Formik. Rendu
 * comme un composant à part (plutôt qu'un useEffect dans le render-prop de <Formik>) pour que le hook
 * reste au top level d'un vrai composant, et non nesté dans une closure.
 */
const HandiEngagementValueSync = ({ hide, locked }: { hide: boolean; locked: boolean }) => {
  const { values, setFieldValue } = useFormikContext<{ handiEngagement?: string }>()

  useEffect(() => {
    if (hide && values.handiEngagement !== "non") {
      setFieldValue("handiEngagement", "non")
    } else if (locked && values.handiEngagement !== "oui") {
      setFieldValue("handiEngagement", "oui")
    }
  }, [hide, locked])

  return null
}

const Formulaire = ({
  onSubmit,
  validate,
  submitError,
  siret: establishment_siret,
  type,
  origin,
  email,
}: {
  onSubmit: (values: any, { setSubmitting, setFieldError }: any) => void
  validate: ReturnType<typeof useServerFieldErrors>["validate"]
  /** Erreur de l'API sans champ du formulaire auquel la rattacher (établissement : SIRET, état…). */
  submitError: string | null
  siret: string
  type: "CFA" | "ENTREPRISE"
  origin: string
  email?: string
}) => {
  const router = useRouter()
  const { widget } = useContext(WidgetContext)
  const formRef = useRef<HTMLFormElement>(null)
  const submitErrorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!submitError) return
    submitErrorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
    submitErrorRef.current?.focus({ preventScroll: true })
  }, [submitError])

  const { data: opcoData } = useQuery({
    queryKey: ["getEntrepriseOpco", establishment_siret],
    queryFn: async () => getEntrepriseOpco(establishment_siret),
  })

  const parsedOpco = parseEnum(OPCOS_LABEL, opcoData?.opco)
  const opco = parsedOpco === OPCOS_LABEL.UNKNOWN_OPCO ? undefined : parsedOpco

  const shouldSelectOpco = type === AUTHTYPE.ENTREPRISE && !opco

  const { hideHandiEngagement, isHandiEngagementLocked, isPending: isEntrepriseInfoPending } = useHandiEngagementState(establishment_siret, type === AUTHTYPE.ENTREPRISE)

  // Sans cette garde, hideHandiEngagement/isHandiEngagementLocked valent leur défaut ("non masqué/non
  // verrouillé") tant que get-entreprise n'a pas résolu : pour une entreprise déjà recensée France
  // Travail, le select et l'encart de sensibilisation s'affichent au premier rendu puis disparaissent —
  // même pattern que CompteRenderer (isLoading || isEntrepriseInfoPending).
  if (isEntrepriseInfoPending) {
    return <LoadingEmptySpace label="Chargement en cours" />
  }

  return (
    <>
      <AccountFormHeading title={type === AUTHTYPE.ENTREPRISE ? "Créez votre compte recruteur" : "Créez votre compte CFA"} />
      <Formik
        validateOnMount={true}
        initialValues={{
          opco: opco ?? "",
          ...(type === AUTHTYPE.ENTREPRISE ? { handiEngagement: "" } : {}),
          last_name: "",
          first_name: "",
          phone: "",
          email,
          origin: origin ?? "Labonnealternance",
        }}
        validationSchema={Yup.object().shape({
          last_name: personNameValidation().required("champ obligatoire"),
          first_name: personNameValidation().required("champ obligatoire"),
          phone: frenchPhoneValidation().required("champ obligatoire"),
          email: emailValidation().lowercase().required("champ obligatoire"),
          opco: shouldSelectOpco ? Yup.string().required("Sélectionnez l'OPCO de votre entreprise, ou « Je ne sais pas ».") : Yup.string(),
          handiEngagement: type === AUTHTYPE.ENTREPRISE ? Yup.string().oneOf(HANDI_ENGAGEMENT_VALUES, "champ obligatoire").required("champ obligatoire") : Yup.string(),
        })}
        validate={validate}
        onSubmit={onSubmit}
      >
        {({ values, isSubmitting, setFieldValue, errors, touched, validateForm, setTouched, submitForm }) => {
          // Le bouton "Continuer" ne dépend pas de isValid : cf. createSubmitWithFocusOnError.
          const handleSubmit = createSubmitWithFocusOnError(formRef, { validateForm, setTouched, submitForm })

          return (
            <form ref={formRef} onSubmit={handleSubmit} noValidate>
              {type === AUTHTYPE.ENTREPRISE && <HandiEngagementValueSync hide={hideHandiEngagement} locked={isHandiEngagementLocked} />}
              <TwoColumnFormLayout
                aside={<InformationLegaleEntreprise siret={establishment_siret} type={type as typeof CFA | typeof ENTREPRISE} opco={opco} hideUnknownOpco />}
                content={
                  <>
                    <FormSection title="1. Vos informations de contact">
                      <Typography sx={{ mb: fr.spacing("6v") }}>
                        {type === AUTHTYPE.ENTREPRISE
                          ? "Vous recevrez les candidatures sur l'e-mail renseigné. Ces informations de contact servent également à vérifier votre identité avant publication de votre offre. La transmission de données inexactes ou fausses pourra donner lieu au refus de votre compte."
                          : "Vous recevrez les candidatures sur l'e-mail renseigné. Ces informations de contact servent à vérifier votre identité avant la validation de votre compte. La transmission de données inexactes ou fausses pourra donner lieu au refus de votre compte."}
                      </Typography>
                      <ContactInfoFields
                        variant={type === AUTHTYPE.ENTREPRISE ? "recruteur" : "cfa"}
                        showRequiredMention={false}
                        emailDisabled={Boolean(email)}
                        emailHint={
                          email
                            ? "L’e-mail que nous utilisons est fourni par votre Carif-Oref et permet de vous connecter. Vous pourrez le modifier dans votre espace personnel."
                            : undefined
                        }
                      />
                    </FormSection>
                    {type === AUTHTYPE.ENTREPRISE && (
                      <OpcoSection
                        title="2. L'OPCO de votre entreprise"
                        detectedOpco={opco}
                        name="opco"
                        value={values.opco as OPCOS_LABEL | ""}
                        onChange={(newValue) => setFieldValue("opco", newValue)}
                        errors={errors}
                        touched={touched}
                      />
                    )}
                    {type === AUTHTYPE.ENTREPRISE && !hideHandiEngagement && (
                      <HandiEngagementSection
                        title="3. Engagez-vous en faveur de l'emploi des personnes en situation de handicap"
                        name="handiEngagement"
                        onChange={(newValue) => setFieldValue("handiEngagement", newValue)}
                        value={values.handiEngagement as HandiEngagement | ""}
                        disabled={isHandiEngagementLocked}
                      />
                    )}
                    {submitError && (
                      <Box ref={submitErrorRef} tabIndex={-1} sx={{ mt: fr.spacing("6v") }}>
                        {/* parse : le message « non diffusible » du serveur contient un lien vers le support */}
                        <Alert severity="error" small description={parse(submitError)} />
                      </Box>
                    )}
                  </>
                }
                buttons={
                  <>
                    {!widget?.isWidget && (
                      <Button type="button" priority="secondary" onClick={() => router.back()}>
                        Annuler
                      </Button>
                    )}
                    <Button aria-label="Continuer la création du compte" type="submit" disabled={isSubmitting}>
                      {isSubmitting && <CircularProgress sx={{ color: "inherit", mr: fr.spacing("2v") }} thickness={4} size={20} />}
                      Continuer
                    </Button>
                  </>
                }
              />
            </form>
          )
        }}
      </Formik>
    </>
  )
}

export const InformationCreationCompte = ({
  isWidget = false,
  establishment_siret,
  email,
  origin,
  type,
}: {
  isWidget?: boolean
  establishment_siret: string
  email?: string
  origin: string
  type: "CFA" | "ENTREPRISE"
}) => {
  const router = useRouter()
  const serverFieldErrors = useServerFieldErrors()
  const [submitError, setSubmitError] = useState<string | null>(null)

  const submitForm = (values: any, { setSubmitting, setFieldError, setFieldValue }: any) => {
    setSubmitError(null)
    const phone = toSubmittedPhone(values.phone)
    setFieldValue("phone", phone, false)
    const payload = { ...values, phone, type, establishment_siret }
    if (type === AUTHTYPE.CFA) {
      payload.opco = OPCOS_LABEL.UNKNOWN_OPCO
    }
    apiPost("/etablissement/creation", { body: payload })
      .then((data) => {
        if (!data) {
          throw new Error("no data")
        }
        const { user, formulaire, token, validated } = data

        if (!user) {
          throw new Error("unexpected: data.user is empty")
        }

        switch (type) {
          case "ENTREPRISE": {
            router.push(
              PAGES.dynamic
                .espaceProCreationOffre({
                  establishment_id: formulaire.establishment_id,
                  type,
                  email: user.email,
                  userId: user._id.toString(),
                  token,
                  displayBanner: !validated,
                  isWidget,
                })
                .getPath()
            )
            break
          }
          case "CFA": {
            if (validated) {
              router.push(PAGES.dynamic.backCreateCFAConfirmation({ email: user.email }).getPath())
            } else {
              router.push(PAGES.static.backCreateCFAEnAttente.getPath())
            }
            break
          }
          default:
            assertUnreachable(type)
            break
        }
        setSubmitting(false)
      })
      .catch((error) => {
        setSubmitting(false)
        // errorCode (parcours entreprise) ou reason (parcours CFA), selon la route
        const errorCode = error instanceof ApiError ? (error.context.errorData?.errorCode ?? error.context.errorData?.reason) : undefined
        if (errorCode === BusinessErrorCodes.ALREADY_EXISTS || errorCode === BusinessErrorCodes.ROLE_DENIED) {
          serverFieldErrors.setServerFieldError(setFieldError, "email", values.email, error.message)
          return
        }
        setSubmitError(error instanceof ApiError && error.message ? error.message : "La création du compte n'a pas abouti. Veuillez réessayer ultérieurement.")
      })
  }

  return (
    <AnimationContainer>
      <Formulaire onSubmit={submitForm} validate={serverFieldErrors.validate} submitError={submitError} siret={establishment_siret} type={type} origin={origin} email={email} />
    </AnimationContainer>
  )
}
