"use client"
import { Box, Button, Container, Flex, Heading, SimpleGrid, Text, useDisclosure, useToast } from "@chakra-ui/react"
import { Form, Formik } from "formik"
import { useMutation, useQuery, useQueryClient } from "react-query"
import { IUserWithAccountFields } from "shared"
import { CFA, ENTREPRISE } from "shared/constants/recruteur"
import * as Yup from "yup"

import InformationLegaleEntreprise from "@/app/(espace-pro)/espace-pro/(connected)/compte/_components/InformationLegaleEntreprise"
import ModificationCompteEmail from "@/app/(espace-pro)/espace-pro/(connected)/compte/_components/ModificationCompteEmail"
import { useUserNavigationContext } from "@/app/(espace-pro)/espace-pro/(connected)/hooks/useUserNavigationContext"
import { useConnectedSessionClient } from "@/app/(espace-pro)/espace-pro/contexts/userContext"
import { Breadcrumb } from "@/app/_components/Breadcrumb"
import { PAGES } from "@/utils/routes.utils"

import { AUTHTYPE } from "../../../../../common/contants"
import { LoadingEmptySpace } from "../../../../../components/espace_pro"
import CustomInput from "../../../../../components/espace_pro/CustomInput"
import { ArrowRightLine } from "../../../../../theme/components/icons"
import { getUser, updateUserWithAccountFields } from "../../../../../utils/api"

export default function CompteRenderer() {
  const { user } = useConnectedSessionClient()

  const client = useQueryClient()
  const toast = useToast()
  const ModificationEmailPopup = useDisclosure()

  const userNavigationContext = useUserNavigationContext()

  const { data, isLoading } = useQuery("user", () => getUser(user._id.toString()))
  const userMutation = useMutation(
    ({ values }: { values: IUserWithAccountFields; isChangingEmail: boolean }) => {
      const userId = user._id.toString()
      return updateUserWithAccountFields(userId, values)
    },
    {
      onSuccess: (_, variables) => {
        client.invalidateQueries("user")
        toast({
          title: "Mise à jour enregistrée avec succès",
          position: "top-right",
          status: "success",
          duration: 2000,
          isClosable: true,
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
    }
  )

  if (isLoading) {
    return <LoadingEmptySpace label="Chargement en cours" />
  }

  return (
    <Container maxW="container.xl">
      <Box mt="16px" mb={6}>
        <Breadcrumb pages={[PAGES.dynamic.administrationDesOffres(userNavigationContext), PAGES.dynamic.compte()]} />
      </Box>
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
        onSubmit={async (values, { setSubmitting, setFieldError }) => {
          setSubmitting(true)
          const isChangingEmail = data.email !== values.email
          userMutation.mutate({ values, isChangingEmail, setFieldError })
          setSubmitting(false)
        }}
      >
        {({ values, isSubmitting, isValid }) => {
          return (
            <>
              <ModificationCompteEmail {...ModificationEmailPopup} />
              <SimpleGrid columns={[1, 1, 1, 2]} spacing={[0, 10]} marginBottom={6}>
                <Box>
                  <Heading>Vos informations de contact</Heading>
                  <Text fontSize="20px" textAlign="justify">
                    {user.type === AUTHTYPE.ENTREPRISE
                      ? "Vos informations de contact seront visibles sur les offres mises en ligne. Vous recevrez les candidatures sur l’email enregistré."
                      : "Vos informations de contact seront visibles sur les offres mises en ligne à partir de votre espace personnel La bonne alternance, pour vos entreprises partenaires."}
                  </Text>
                  {user.type === AUTHTYPE.CFA && (
                    <Text fontSize="20px" textAlign="justify" mt={2}>
                      Vous recevrez les candidatures sur l’email enregistré.
                    </Text>
                  )}
                  <Box mt={4}>
                    <Form>
                      <CustomInput name="last_name" label="Nom" type="text" value={values.last_name} />
                      <CustomInput name="first_name" label="Prénom" type="test" value={values.first_name} />
                      <CustomInput name="phone" label="Téléphone" type="tel" pattern="[0-9]{10}" maxLength="10" value={values.phone} />
                      <CustomInput name="email" label="Email" type="email" value={values.email} />
                      <Flex justify="flex-end" mt={10}>
                        <Button type="submit" variant="form" leftIcon={<ArrowRightLine />} isActive={isValid} isDisabled={!isValid || isSubmitting} isLoading={isSubmitting}>
                          Enregistrer
                        </Button>
                      </Flex>
                    </Form>
                  </Box>
                </Box>
                <Box>
                  <InformationLegaleEntreprise siret={data.establishment_siret} type={data.type as typeof CFA | typeof ENTREPRISE} />
                </Box>
              </SimpleGrid>
            </>
          )
        }}
      </Formik>
    </Container>
  )
}
