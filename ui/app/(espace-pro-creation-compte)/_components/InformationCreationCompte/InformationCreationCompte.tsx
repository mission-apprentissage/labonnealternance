"use client"

import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import { Box, CircularProgress, Typography } from "@mui/material"
import { useQuery } from "@tanstack/react-query"
import { Formik, useFormikContext } from "formik"
import { useRouter } from "next/navigation"
import { useContext, useEffect, useRef } from "react"
import { assertUnreachable, parseEnum } from "shared"
import type { CFA, ENTREPRISE } from "shared/constants/recruteur"
import { OPCOS_LABEL } from "shared/constants/recruteur"
import type { HandiEngagement } from "shared/models/referentiel-engagement-entreprise.model"
import { HANDI_ENGAGEMENT_VALUES } from "shared/models/referentiel-engagement-entreprise.model"
import * as Yup from "yup"
import CustomInput from "@/app/_components/CustomInput"
import { InformationHandiEngagement } from "@/app/(espace-pro-creation-compte)/_components/InformationHandiEngagement"
import { InformationOpco } from "@/app/(espace-pro-creation-compte)/_components/InformationOpco"
import { HandiEngagementSelect } from "@/app/(espace-pro)/_components/HandiEngagementSelect"
import { OpcoSelect } from "@/app/(espace-pro)/_components/OpcoSelect"
import InformationLegaleEntreprise from "@/app/(espace-pro)/espace-pro/(connected)/_components/InformationLegaleEntreprise"
import { useHandiEngagementState } from "@/app/hooks/use-handi-engagement-state"
import { AUTHTYPE } from "@/common/contants"
import { personNameValidation, phoneValidation } from "@/common/validation/field-validations"
import { AnimationContainer } from "@/components/espace_pro/index"
import { WidgetContext } from "@/context/contextWidget"
import { infosOpcos } from "@/theme/components/logos/infos-opcos"
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
  siret: establishment_siret,
  type,
  origin,
  email,
  viewerType,
}: {
  onSubmit: (values: any, { setSubmitting, setFieldError }: any) => void
  siret: string
  type: "CFA" | "ENTREPRISE"
  origin: string
  email?: string
  viewerType: AUTHTYPE
}) => {
  const router = useRouter()
  const { widget } = useContext(WidgetContext)
  const formRef = useRef<HTMLFormElement>(null)

  const { data: opcoData } = useQuery({
    queryKey: ["getEntrepriseOpco", establishment_siret],
    queryFn: async () => getEntrepriseOpco(establishment_siret),
  })

  const parsedOpco = parseEnum(OPCOS_LABEL, opcoData?.opco)
  const opco = parsedOpco === OPCOS_LABEL.UNKNOWN_OPCO ? undefined : parsedOpco

  const shouldSelectOpco = type === AUTHTYPE.ENTREPRISE && !opco

  const { hideHandiEngagement, isHandiEngagementLocked } = useHandiEngagementState(establishment_siret, type === AUTHTYPE.ENTREPRISE)

  return (
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
        phone: phoneValidation().required("champ obligatoire"),
        email: Yup.string().email("Insérez un email valide").lowercase().required("champ obligatoire"),
        opco: shouldSelectOpco ? Yup.string().min(1, "champ obligatoire").required("champ obligatoire") : Yup.string(),
        handiEngagement: type === AUTHTYPE.ENTREPRISE ? Yup.string().oneOf(HANDI_ENGAGEMENT_VALUES, "champ obligatoire").required("champ obligatoire") : Yup.string(),
      })}
      onSubmit={onSubmit}
    >
      {({ values, isSubmitting, setFieldValue, errors, touched, validateForm, setTouched, submitForm }) => {
        const infosOpco = infosOpcos.find((x) => x.nom === values.opco)

        // Le bouton "Continuer" ne dépend plus de isValid : au clic, on force l'affichage de l'erreur
        // sur tous les champs invalides (setTouched) puis on scrolle/focus le premier champ en erreur.
        const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
          e.preventDefault()
          const formErrors = await validateForm()
          setTouched(Object.fromEntries(Object.keys(formErrors).map((k) => [k, true])), false)
          if (Object.keys(formErrors).length > 0 && formRef.current) {
            const selector = Object.keys(formErrors)
              .map((name) => `[name="${name}"]`)
              .join(", ")
            const firstErrorEl = formRef.current.querySelector<HTMLElement>(selector)
            if (firstErrorEl) {
              firstErrorEl.scrollIntoView({ behavior: "smooth", block: "center" })
              firstErrorEl.focus()
            }
            return
          }
          submitForm()
        }

        return (
          <form ref={formRef} onSubmit={handleSubmit} noValidate>
            {type === AUTHTYPE.ENTREPRISE && <HandiEngagementValueSync hide={hideHandiEngagement} locked={isHandiEngagementLocked} />}
            <FormulaireLayout
              type={type}
              left={
                <>
                  <CustomInput hideAsterisk name="last_name" label="Nom" type="text" value={values.last_name} />
                  <CustomInput hideAsterisk name="first_name" label="Prénom" type="text" value={values.first_name} />
                  <CustomInput hideAsterisk name="phone" label="Numéro de téléphone" type="tel" pattern="[0-9]{10}" maxLength="10" value={values.phone} />
                  <CustomInput
                    hideAsterisk
                    isDisabled={email ? true : false}
                    name="email"
                    label="Email"
                    type="email"
                    pb={fr.spacing("2v")}
                    value={values.email}
                    info={
                      email
                        ? "L’email que nous utilisons est fourni par votre Carif Oref, et permet de vous connecter. Vous pourrez le modifier dans votre espace personnel."
                        : "Privilégiez votre adresse professionnelle"
                    }
                  />
                  <Box
                    className={fr.cx("fr-messages-group")}
                    sx={{
                      my: fr.spacing("4v"),
                    }}
                  >
                    <Box sx={{ fontSize: "0.75rem", lineHeight: "1.25rem", mt: "0 !important", display: "block !important" }} className="fr-info-text">
                      Pour faciliter la vérification de votre compte par nos équipes, et accélérer la mise en ligne de votre offre, nous vous conseillons d’utiliser une adresse
                      email comportant <span style={{ fontWeight: "bold" }}>le nom de domaine de votre établissement.</span>
                    </Box>
                  </Box>
                  {shouldSelectOpco && (
                    <OpcoSelect name="opco" onChange={async (newValue) => setFieldValue("opco", newValue)} value={values.opco as OPCOS_LABEL} errors={errors} touched={touched} />
                  )}
                  {type === AUTHTYPE.ENTREPRISE && !hideHandiEngagement && (
                    <HandiEngagementSelect
                      name="handiEngagement"
                      onChange={async (newValue) => setFieldValue("handiEngagement", newValue)}
                      value={values.handiEngagement as HandiEngagement | ""}
                      disabled={isHandiEngagementLocked}
                    />
                  )}
                  <Box sx={{ display: "flex", justifyContent: "flex-end", alignItems: "center", mt: fr.spacing("5v") }}>
                    {!widget?.isWidget && (
                      <Box sx={{ mr: fr.spacing("5v") }}>
                        <Button type="button" priority="secondary" onClick={() => router.back()}>
                          Annuler
                        </Button>
                      </Box>
                    )}
                    <Button aria-label="Continuer la création du compte" type="submit" disabled={isSubmitting}>
                      {isSubmitting && <CircularProgress sx={{ color: "inherit", mr: fr.spacing("2v") }} thickness={4} size={20} />}
                      Continuer
                    </Button>
                  </Box>
                </>
              }
              right={
                <>
                  <InformationLegaleEntreprise siret={establishment_siret} type={type as typeof CFA | typeof ENTREPRISE} opco={opco} viewerType={viewerType} />
                  {infosOpco && <InformationOpco isUpdatable={shouldSelectOpco} infosOpco={infosOpco} resetOpcoChoice={async () => setFieldValue("opco", "")} />}
                  {!hideHandiEngagement && <InformationHandiEngagement />}
                </>
              }
            />
          </form>
        )
      }}
    </Formik>
  )
}

const FormulaireLayout = ({ left, right, type }: { left: React.ReactNode; right: React.ReactNode; type: string }) => {
  return (
    <Box
      sx={{
        rowGap: fr.spacing("8v"),
        columnGap: fr.spacing("8v"),
        display: "grid",
        gridTemplateColumns: { xs: "repeat(1, 1fr)", md: "repeat(2, 1fr)" },
        gridTemplateRows: { xs: "repeat(3, auto)", md: "auto 1fr" },
        mt: 0,
      }}
    >
      <Box>
        <Typography component="h2" sx={{ fontSize: "24px", fontWeight: "bold" }}>
          {type === AUTHTYPE.ENTREPRISE ? "Vos informations de contact" : "Créez votre compte"}
        </Typography>
        <Typography sx={{ fontSize: "20px", pt: fr.spacing("2v"), pb: fr.spacing("4v") }}>
          {type === AUTHTYPE.ENTREPRISE
            ? "Seul le numéro de téléphone sera visible sur vos offres. Vous recevrez les candidatures sur l'email renseigné."
            : "Seul le numéro de téléphone sera visible sur les offres de vos entreprises partenaires. Vous recevrez les candidatures sur l'email renseigné."}
        </Typography>
        {type === AUTHTYPE.ENTREPRISE && <Typography sx={{ pb: fr.spacing("4v") }}>Tous les champs sont obligatoires.</Typography>}
        <Box>{left}</Box>
      </Box>
      <Box>{right}</Box>
    </Box>
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

  const submitForm = (values: any, { setSubmitting, setFieldError }: any) => {
    const payload = { ...values, type, establishment_siret }
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
        if (error instanceof ApiError) {
          setFieldError("email", error.message)
          setSubmitting(false)
        }
      })
  }

  return (
    <AnimationContainer>
      <Formulaire onSubmit={submitForm} siret={establishment_siret} type={type} origin={origin} email={email} viewerType={type} />
    </AnimationContainer>
  )
}
