"use client"

import { fr } from "@codegouvfr/react-dsfr"
import Alert from "@codegouvfr/react-dsfr/Alert"
import { Button } from "@codegouvfr/react-dsfr/Button"
import { Box, CircularProgress, Typography } from "@mui/material"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Formik } from "formik"
import { useRef } from "react"
import type { IUserWithAccountFields } from "shared"
import { BusinessErrorCodes } from "shared/constants/error-codes"
import type { CFA, ENTREPRISE } from "shared/constants/recruteur"
import type { HandiEngagement } from "shared/models/referentiel-engagement-entreprise.model"
import { HANDI_ENGAGEMENT_VALUES } from "shared/models/referentiel-engagement-entreprise.model"
import * as Yup from "yup"
import { ContactInfoFields } from "@/app/_components/ContactInfoFields"
import { AccountFormHeading, FormSection } from "@/app/_components/FormSection"
import { createSubmitWithFocusOnError, useServerFieldErrors } from "@/app/_components/submit-with-focus-on-error"
import { TwoColumnFormLayout } from "@/app/_components/TwoColumnFormLayout"
import { HandiEngagementSection } from "@/app/(espace-pro)/_components/HandiEngagementSection"
import LoadingEmptySpace from "@/app/(espace-pro)/_components/LoadingEmptySpace"
import { useConnectedSessionClient } from "@/app/(espace-pro)/espace-pro/contexts/userContext"
import { useDisclosure } from "@/app/hooks/use-disclosure"
import { useHandiEngagementState } from "@/app/hooks/use-handi-engagement-state"
import { useToast } from "@/app/hooks/useToast"
import { AUTHTYPE } from "@/common/contants"
import { emailValidation, frenchPhoneValidation, toSubmittedPhone } from "@/common/validation/field-validations"
import { getUser, updateUserWithAccountFields } from "@/utils/api"
import { ApiError } from "@/utils/api.utils"
import { EMAIL_ALREADY_USED_ERROR } from "@/utils/validation-messages"
import InformationLegaleEntreprise from "./InformationLegaleEntreprise"
import ModificationCompteEmail from "./ModificationCompteEmail"

// handiEngagement n'est pertinent que pour un utilisateur de type ENTREPRISE (cf. isHandiEngagementLocked/
// hideHandiEngagement plus bas) : optionnel, comme sur la route PUT /user/:userId qu'il alimente.
interface IUpdateUserWithAccountFields extends IUserWithAccountFields {
  handiEngagement?: HandiEngagement
}

export default function CompteRenderer() {
  const { user } = useConnectedSessionClient()

  const client = useQueryClient()
  const toast = useToast()
  const ModificationEmailPopup = useDisclosure()
  const formRef = useRef<HTMLFormElement>(null)
  const serverFieldErrors = useServerFieldErrors()

  const { data, isLoading } = useQuery({
    queryKey: ["user"],
    queryFn: async () => getUser(user._id.toString()),
    throwOnError: true,
  })

  const {
    needsEntrepriseInfo,
    hideHandiEngagement,
    isHandiEngagementLocked,
    isPending: isEntrepriseInfoPending,
  } = useHandiEngagementState(data?.establishment_siret, data?.type === AUTHTYPE.ENTREPRISE)

  const userMutation = useMutation({
    mutationFn: async ({ values }: { values: IUpdateUserWithAccountFields; isChangingEmail: boolean }) => {
      const userId = user._id.toString()
      return updateUserWithAccountFields(userId, values)
    },

    onSuccess: (_, variables) => {
      client.invalidateQueries({
        queryKey: ["user"],
      })
      // Un "oui" vient potentiellement d'être enregistré dans referentiel_engagement_entreprise : sans ce
      // refetch, isHandiEngagementLocked reste basé sur l'ancienne valeur et le champ ne se désactive pas
      // immédiatement après le save.
      if (needsEntrepriseInfo) {
        client.invalidateQueries({
          queryKey: ["get-entreprise", data?.establishment_siret],
        })
      }

      toast({
        title: "Mise à jour enregistrée avec succès",
      })

      if (variables.isChangingEmail) {
        ModificationEmailPopup.onOpen()
      }
    },
  })

  if (isLoading || isEntrepriseInfoPending) {
    return <LoadingEmptySpace label="Chargement en cours" />
  }

  const isAccountWithEstablishment = data.type === AUTHTYPE.ENTREPRISE || data.type === AUTHTYPE.CFA
  const contactVariant = data.type === AUTHTYPE.ENTREPRISE ? "recruteur" : data.type === AUTHTYPE.CFA ? "cfa" : "default"

  return (
    <>
      <Formik
        validateOnMount={true}
        enableReinitialize={true}
        initialValues={{
          last_name: data.last_name,
          first_name: data.first_name,
          phone: data.phone,
          email: data.email,
          // "non" par défaut tant que ce n'est pas verrouillé sur "oui"
          ...(data.type === AUTHTYPE.ENTREPRISE && !hideHandiEngagement ? { handiEngagement: isHandiEngagementLocked ? "oui" : "non" } : {}),
        }}
        validationSchema={Yup.object().shape({
          last_name: Yup.string().required("champ obligatoire"),
          first_name: Yup.string().required("champ obligatoire"),
          phone: frenchPhoneValidation().required("champ obligatoire"),
          email: emailValidation().required("champ obligatoire"),
          // Requis uniquement quand le champ est effectivement affiché et modifiable : masqué (source France
          // Travail) ou verrouillé (déjà "oui" via La bonne alternance), sa valeur est déjà figée par ailleurs.
          handiEngagement:
            data.type === AUTHTYPE.ENTREPRISE && !hideHandiEngagement
              ? Yup.string().oneOf(HANDI_ENGAGEMENT_VALUES, "champ obligatoire").required("champ obligatoire")
              : Yup.string(),
        })}
        validate={serverFieldErrors.validate}
        onSubmit={async (values, { setFieldValue, setFieldError, setSubmitting }) => {
          if (userMutation.isPending) return
          setSubmitting(true)
          const phone = toSubmittedPhone(values.phone)
          setFieldValue("phone", phone, false)
          const isChangingEmail = data.email !== values.email
          // "" (aucun choix, champ non affiché ou non encore sélectionné) n'est pas une valeur valide pour
          // l'API : on ne transmet le champ que lorsqu'il a réellement une valeur.
          const { handiEngagement, ...rest } = values
          userMutation.mutate(
            {
              values: { ...rest, phone, ...(handiEngagement === "oui" || handiEngagement === "non" ? { handiEngagement } : {}) },
              isChangingEmail,
            },
            {
              onError: (error) => {
                // Tout autre 400 (validation du body…) passe par l'Alert générique
                if (error instanceof ApiError && error.context.errorData?.error === BusinessErrorCodes.EMAIL_ALREADY_EXISTS) {
                  // L'erreur est portée par le champ : isError ne doit pas afficher l'Alert générique
                  userMutation.reset()
                  serverFieldErrors.setServerFieldError(setFieldError, "email", values.email, EMAIL_ALREADY_USED_ERROR)
                }
              },
            }
          )
          setSubmitting(false)
        }}
      >
        {(formik) => {
          const { values, setFieldValue } = formik
          // Le bouton "Enregistrer" ne dépend pas de isValid : cf. createSubmitWithFocusOnError.
          const handleSubmit = createSubmitWithFocusOnError(formRef, formik)

          return (
            <>
              <ModificationCompteEmail {...ModificationEmailPopup} />
              <AccountFormHeading title="Vos informations de contact" />
              <form ref={formRef} onSubmit={handleSubmit} noValidate>
                <TwoColumnFormLayout
                  aside={isAccountWithEstablishment && <InformationLegaleEntreprise siret={data.establishment_siret} type={data.type as typeof CFA | typeof ENTREPRISE} />}
                  content={
                    <>
                      <FormSection title="1. Vos informations de contact">
                        <Typography sx={{ mb: fr.spacing("6v") }}>
                          {user.type === AUTHTYPE.CFA
                            ? "Vos informations de contact seront visibles sur les offres mises en ligne à partir de votre espace personnel La bonne alternance, pour vos entreprises partenaires. Vous recevrez les candidatures sur l'e-mail enregistré."
                            : "Vos informations de contact seront visibles sur les offres mises en ligne. Vous recevrez les candidatures sur l'e-mail enregistré."}
                        </Typography>
                        <ContactInfoFields variant={contactVariant} showRequiredMention={false} />
                      </FormSection>
                      {data.type === AUTHTYPE.ENTREPRISE && !hideHandiEngagement && (
                        <HandiEngagementSection
                          title="2. Engagez-vous en faveur de l'emploi des personnes en situation de handicap"
                          name="handiEngagement"
                          onChange={(newValue) => setFieldValue("handiEngagement", newValue)}
                          value={values.handiEngagement as HandiEngagement | ""}
                          disabled={isHandiEngagementLocked}
                        />
                      )}
                      {userMutation.isError && (
                        <Box sx={{ mt: fr.spacing("6v") }}>
                          <Alert severity="error" small description="La mise à jour n'a pas pu être enregistrée. Veuillez réessayer ultérieurement." />
                        </Box>
                      )}
                    </>
                  }
                  buttons={
                    // aria-disabled plutôt que disabled : un bouton désactivé perd le focus, ce qui peut couper l'annonce du toast (RGAA 12.8)
                    <Button type="submit" nativeButtonProps={{ "aria-disabled": userMutation.isPending }}>
                      {userMutation.isPending && <CircularProgress sx={{ color: "inherit", mr: fr.spacing("2v") }} thickness={4} size={20} />}
                      Enregistrer
                    </Button>
                  }
                />
              </form>
            </>
          )
        }}
      </Formik>
    </>
  )
}
