"use client"

import { fr } from "@codegouvfr/react-dsfr"
import { Button } from "@codegouvfr/react-dsfr/Button"
import { Box, CircularProgress, Typography } from "@mui/material"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Formik } from "formik"
import { useRef } from "react"
import type { IUserWithAccountFields } from "shared"
import type { CFA, ENTREPRISE } from "shared/constants/recruteur"
import type { HandiEngagement } from "shared/models/referentiel-engagement-entreprise.model"
import { HANDI_ENGAGEMENT_VALUES } from "shared/models/referentiel-engagement-entreprise.model"
import * as Yup from "yup"
import { ContactInfoFields } from "@/app/_components/ContactInfoFields"
import { createSubmitWithFocusOnError } from "@/app/_components/submit-with-focus-on-error"
import { TwoColumnFormLayout } from "@/app/_components/TwoColumnFormLayout"
import { InformationHandiEngagement } from "@/app/(espace-pro-creation-compte)/_components/InformationHandiEngagement"
import { HandiEngagementSelect } from "@/app/(espace-pro)/_components/HandiEngagementSelect"
import { useConnectedSessionClient } from "@/app/(espace-pro)/espace-pro/contexts/userContext"
import { useDisclosure } from "@/app/hooks/use-disclosure"
import { useHandiEngagementState } from "@/app/hooks/use-handi-engagement-state"
import { useToast } from "@/app/hooks/useToast"
import { AUTHTYPE } from "@/common/contants"
import { LoadingEmptySpace } from "@/components/espace_pro"
import { getUser, updateUserWithAccountFields } from "@/utils/api"
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

    onError: (error: any, variables: any) => {
      if (error.response.data.reason === "EMAIL_TAKEN") {
        variables.setFieldError("email", "L'adresse mail est déjà associée à un compte La bonne alternance.")
      }
    },
  })

  if (isLoading || isEntrepriseInfoPending) {
    return <LoadingEmptySpace label="Chargement en cours" />
  }

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
          phone: Yup.string()
            .matches(/^[0-9]+$/, "Le téléphone est composé uniquement de chiffres")
            .min(10, "le téléphone est sur 10 chiffres")
            .max(10, "le téléphone est sur 10 chiffres")
            .required("champ obligatoire"),
          email: Yup.string().email("Insérez un email valide").required("champ obligatoire"),
          // Requis uniquement quand le champ est effectivement affiché et modifiable : masqué (source France
          // Travail) ou verrouillé (déjà "oui" via La bonne alternance), sa valeur est déjà figée par ailleurs.
          handiEngagement:
            data.type === AUTHTYPE.ENTREPRISE && !hideHandiEngagement
              ? Yup.string().oneOf(HANDI_ENGAGEMENT_VALUES, "champ obligatoire").required("champ obligatoire")
              : Yup.string(),
        })}
        onSubmit={async (values, { setSubmitting }) => {
          setSubmitting(true)
          const isChangingEmail = data.email !== values.email
          // "" (aucun choix, champ non affiché ou non encore sélectionné) n'est pas une valeur valide pour
          // l'API : on ne transmet le champ que lorsqu'il a réellement une valeur.
          const { handiEngagement, ...rest } = values
          userMutation.mutate({
            values: { ...rest, ...(handiEngagement === "oui" || handiEngagement === "non" ? { handiEngagement } : {}) },
            isChangingEmail,
          })
          setSubmitting(false)
        }}
      >
        {(formik) => {
          const { values, isSubmitting, setFieldValue } = formik
          // Le bouton "Enregistrer" ne dépend plus de isValid : cf. createSubmitWithFocusOnError, qui
          // force l'affichage de l'erreur sur tous les champs invalides et scrolle/focus le premier
          // plutôt que de bloquer la sauvegarde du reste du formulaire (ex: téléphone/email) tant que
          // handiEngagement n'a pas de valeur.
          const handleSubmit = createSubmitWithFocusOnError(formRef, formik)

          return (
            <>
              <ModificationCompteEmail {...ModificationEmailPopup} />
              <form ref={formRef} onSubmit={handleSubmit} noValidate>
                <TwoColumnFormLayout
                  left={
                    <>
                      <Typography
                        component="h2"
                        sx={{ fontWeight: 700, fontSize: { xs: "24px !important", md: "32px !important" }, lineHeight: { xs: "32px !important", md: "40px !important" } }}
                      >
                        Vos informations de contact
                      </Typography>
                      <Typography
                        sx={{
                          mt: fr.spacing("2v"),
                          fontSize: "20px",
                        }}
                      >
                        {user.type === AUTHTYPE.ENTREPRISE
                          ? "Vos informations de contact seront visibles sur les offres mises en ligne. Vous recevrez les candidatures sur l’email enregistré."
                          : "Vos informations de contact seront visibles sur les offres mises en ligne à partir de votre espace personnel La bonne alternance, pour vos entreprises partenaires."}
                      </Typography>
                      {user.type === AUTHTYPE.CFA && (
                        <Typography sx={{ fontSize: "20px", mt: fr.spacing("2v") }}>Vous recevrez les candidatures sur l’email enregistré.</Typography>
                      )}
                      <Box sx={{ mt: fr.spacing("6v") }}>
                        <ContactInfoFields />
                        {data.type === AUTHTYPE.ENTREPRISE && !hideHandiEngagement && (
                          <HandiEngagementSelect
                            name="handiEngagement"
                            onChange={(newValue) => setFieldValue("handiEngagement", newValue)}
                            value={values.handiEngagement as HandiEngagement | ""}
                            disabled={isHandiEngagementLocked}
                          />
                        )}
                      </Box>
                    </>
                  }
                  right={
                    <>
                      <InformationLegaleEntreprise siret={data.establishment_siret} type={data.type as typeof CFA | typeof ENTREPRISE} viewerType={user.type} />
                      {data.type === AUTHTYPE.ENTREPRISE && !hideHandiEngagement && !isHandiEngagementLocked && <InformationHandiEngagement />}
                    </>
                  }
                  buttons={
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting && <CircularProgress sx={{ color: "inherit", mr: fr.spacing("2v") }} thickness={4} size={20} />}
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
