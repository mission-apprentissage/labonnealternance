"use client"

import { fr } from "@codegouvfr/react-dsfr"
import { Button } from "@codegouvfr/react-dsfr/Button"
import { Box, CircularProgress, Typography } from "@mui/material"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Form, Formik } from "formik"
import type { IUserWithAccountFields } from "shared"
import type { CFA, ENTREPRISE } from "shared/constants/recruteur"
import type { HandiEngagement } from "shared/models/referentiel-engagement-entreprise.model"
import { EntrepriseEngagementSources } from "shared/models/referentiel-engagement-entreprise.model"
import * as Yup from "yup"
import CustomInput from "@/app/_components/CustomInput"
import { InformationHandiEngagement } from "@/app/(espace-pro-creation-compte)/_components/InformationHandiEngagement"
import { HandiEngagementSelect } from "@/app/(espace-pro)/_components/HandiEngagementSelect"
import { useConnectedSessionClient } from "@/app/(espace-pro)/espace-pro/contexts/userContext"
import { useDisclosure } from "@/app/hooks/use-disclosure"
import { useToast } from "@/app/hooks/useToast"
import { AUTHTYPE } from "@/common/contants"
import { LoadingEmptySpace } from "@/components/espace_pro"
import { ArrowRightLine } from "@/theme/components/icons"
import { getEntrepriseInformation, getUser, updateUserWithAccountFields } from "@/utils/api"
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

  const { data, isLoading } = useQuery({
    queryKey: ["user"],
    queryFn: async () => getUser(user._id.toString()),
    throwOnError: true,
  })

  const { data: entrepriseInfosResult } = useQuery({
    queryKey: ["get-entreprise", data?.establishment_siret],
    queryFn: () => getEntrepriseInformation(data!.establishment_siret, { skipUpdate: true }),
    enabled: Boolean(data?.establishment_siret && data.type === AUTHTYPE.ENTREPRISE),
  })
  // error est le discriminant du type retourné par getEntrepriseInformation : plus simple et plus sûr
  // que de vérifier structurellement la présence de "data" puis de "siret" dans ce "data".
  const entrepriseInfos = entrepriseInfosResult?.error === false ? entrepriseInfosResult.data : undefined
  const engagementHandicapOrigin = entrepriseInfos?.engagementHandicapOrigin
  // France Travail a déjà recensé l'entreprise : on ne redemande pas son consentement, champ et bloc masqués.
  const hideHandiEngagement = engagementHandicapOrigin === EntrepriseEngagementSources.FRANCE_TRAVAIL
  // Un "oui" déjà enregistré via La bonne alternance est irréversible depuis cet écran (one way ticket) :
  // le champ reste visible mais verrouillé sur "oui", et le bloc de sensibilisation n'a plus lieu d'être.
  const isHandiEngagementLocked = engagementHandicapOrigin === EntrepriseEngagementSources.LBA

  const userMutation = useMutation({
    mutationFn: async ({ values }: { values: IUpdateUserWithAccountFields; isChangingEmail: boolean }) => {
      const userId = user._id.toString()
      return updateUserWithAccountFields(userId, values)
    },

    onSuccess: (_, variables) => {
      client.invalidateQueries({
        queryKey: ["user"],
      })

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

  if (isLoading) {
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
          ...(data.type === AUTHTYPE.ENTREPRISE && !hideHandiEngagement ? { handiEngagement: isHandiEngagementLocked ? "oui" : "" } : {}),
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
            data.type === AUTHTYPE.ENTREPRISE && !hideHandiEngagement ? Yup.string().oneOf(["oui", "non"], "champ obligatoire").required("champ obligatoire") : Yup.string(),
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
        {({ values, isSubmitting, isValid, setFieldValue }) => {
          return (
            <>
              <ModificationCompteEmail {...ModificationEmailPopup} />
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(1, 1fr)", lg: "repeat(2, 1fr)" }, gap: fr.spacing("4v"), marginBottom: fr.spacing("4v") }}>
                <Box>
                  <Typography component="h2" sx={{ fontWeight: 700 }}>
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
                  {user.type === AUTHTYPE.CFA && <Typography sx={{ fontSize: "20px", mt: fr.spacing("2v") }}>Vous recevrez les candidatures sur l’email enregistré.</Typography>}
                  <Box sx={{ mt: fr.spacing("4v") }}>
                    <Form>
                      <CustomInput name="last_name" label="Nom" type="text" value={values.last_name} />
                      <CustomInput name="first_name" label="Prénom" type="test" value={values.first_name} />
                      <CustomInput name="phone" label="Téléphone" type="tel" pattern="[0-9]{10}" maxLength="10" value={values.phone} />
                      <CustomInput name="email" label="Email" type="email" value={values.email} />
                      {data.type === AUTHTYPE.ENTREPRISE && !hideHandiEngagement && (
                        <HandiEngagementSelect
                          name="handiEngagement"
                          onChange={(newValue) => setFieldValue("handiEngagement", newValue)}
                          value={values.handiEngagement as HandiEngagement | ""}
                          disabled={isHandiEngagementLocked}
                        />
                      )}
                      <Box sx={{ display: "flex", justifyContent: "flex-end", mt: fr.spacing("10v"), mb: fr.spacing("4v") }}>
                        <Button type="submit" disabled={!isValid || isSubmitting}>
                          {isSubmitting ? (
                            <CircularProgress sx={{ color: "inherit", mr: fr.spacing("2v") }} thickness={4} size={20} />
                          ) : (
                            <ArrowRightLine sx={{ width: 16, height: 16, mr: fr.spacing("2v") }} />
                          )}
                          Enregistrer
                        </Button>
                      </Box>
                    </Form>
                  </Box>
                </Box>
                <Box>
                  <InformationLegaleEntreprise siret={data.establishment_siret} type={data.type as typeof CFA | typeof ENTREPRISE} viewerType={user.type} />
                  {data.type === AUTHTYPE.ENTREPRISE && !hideHandiEngagement && !isHandiEngagementLocked && <InformationHandiEngagement />}
                </Box>
              </Box>
            </>
          )
        }}
      </Formik>
    </>
  )
}
