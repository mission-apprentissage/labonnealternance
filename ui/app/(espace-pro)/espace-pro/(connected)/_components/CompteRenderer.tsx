"use client"

import { fr } from "@codegouvfr/react-dsfr"
import { Button } from "@codegouvfr/react-dsfr/Button"
import { Box, CircularProgress, Typography } from "@mui/material"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Form, Formik } from "formik"
import type { IUserWithAccountFields } from "shared"
import type { CFA, ENTREPRISE } from "shared/constants/recruteur"
import * as Yup from "yup"

import InformationLegaleEntreprise from "./InformationLegaleEntreprise"
import ModificationCompteEmail from "./ModificationCompteEmail"
import { AUTHTYPE } from "@/common/contants"
import { useConnectedSessionClient } from "@/app/(espace-pro)/espace-pro/contexts/userContext"
import CustomInput from "@/app/_components/CustomInput"
import { useToast } from "@/app/hooks/useToast"
import { useDisclosure } from "@/common/hooks/useDisclosure"

import { LoadingEmptySpace } from "@/components/espace_pro"
import { ArrowRightLine } from "@/theme/components/icons"
import { getUser, updateUserWithAccountFields } from "@/utils/api"

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
  const userMutation = useMutation({
    mutationFn: async ({ values }: { values: IUserWithAccountFields; isChangingEmail: boolean }) => {
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
        })}
        onSubmit={async (values, { setSubmitting }) => {
          setSubmitting(true)
          const isChangingEmail = data.email !== values.email
          userMutation.mutate({ values, isChangingEmail })
          setSubmitting(false)
        }}
      >
        {({ values, isSubmitting, isValid }) => {
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
                      textAlign: "justify",
                    }}
                  >
                    {user.type === AUTHTYPE.ENTREPRISE
                      ? "Vos informations de contact seront visibles sur les offres mises en ligne. Vous recevrez les candidatures sur l’email enregistré."
                      : "Vos informations de contact seront visibles sur les offres mises en ligne à partir de votre espace personnel La bonne alternance, pour vos entreprises partenaires."}
                  </Typography>
                  {user.type === AUTHTYPE.CFA && (
                    <Typography sx={{ fontSize: "20px", textAlign: "justify", mt: fr.spacing("2v") }}>Vous recevrez les candidatures sur l’email enregistré.</Typography>
                  )}
                  <Box sx={{ mt: fr.spacing("4v") }}>
                    <Form>
                      <CustomInput name="last_name" label="Nom" type="text" value={values.last_name} />
                      <CustomInput name="first_name" label="Prénom" type="test" value={values.first_name} />
                      <CustomInput name="phone" label="Téléphone" type="tel" pattern="[0-9]{10}" maxLength="10" value={values.phone} />
                      <CustomInput name="email" label="Email" type="email" value={values.email} />
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
                </Box>
              </Box>
            </>
          )
        }}
      </Formik>
    </>
  )
}
