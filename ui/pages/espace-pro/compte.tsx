import { Box, Breadcrumb, BreadcrumbItem, BreadcrumbLink, Button, Container, Flex, Heading, SimpleGrid, Text, useToast } from "@chakra-ui/react"
import { Form, Formik } from "formik"
import { useRouter } from "next/router"
import { useMutation, useQuery, useQueryClient } from "react-query"
import * as Yup from "yup"

import { AUTHTYPE } from "../../common/contants"
import useAuth from "../../common/hooks/useAuth"
import AnimationContainer from "../../components/espace_pro/AnimationContainer"
import CustomInput from "../../components/espace_pro/CustomInput"
import InformationLegaleEntreprise from "../../components/espace_pro/InformationLegaleEntreprise"
import Layout from "../../components/espace_pro/Layout"
import withAuth from "../../components/espace_pro/withAuth"
import { ArrowDropRightLine, ArrowRightLine } from "../../theme/components/icons"
import { getUser, updateEntreprise, updatePartenaire } from "../../utils/api"

function Compte() {
  const client = useQueryClient()
  const toast = useToast()
  const router = useRouter()
  const [auth] = useAuth()

  const getUserNavigationContext = () => {
    switch (auth.type) {
      case AUTHTYPE.ENTREPRISE:
        return `/espace-pro/administration/entreprise/${auth.establishment_id}`
      case AUTHTYPE.CFA:
        return `/espace-pro/administration`
      default:
        break
    }
  }

  const { data, isLoading } = useQuery("user", () => getUser(auth.id))
  // @ts-expect-error: TODO
  const userMutation = useMutation(({ userId, establishment_id, values }) => updateEntreprise(userId, establishment_id, values), {
    onSuccess: () => {
      client.invalidateQueries("user")
    },
  })
  // @ts-expect-error: TODO
  const partenaireMutation = useMutation(({ userId, values }) => updatePartenaire(userId, values), {
    onSuccess: () => {
      client.invalidateQueries("user")
    },
  })

  if (isLoading) {
    return <Text>Chargement en cours...</Text>
  }

  return (
    <AnimationContainer>
      <Layout>
        <Container maxW="container.xl">
          <Box mt="16px" mb={6}>
            <Breadcrumb separator={<ArrowDropRightLine color="grey.600" />} textStyle="xs">
              {auth.type !== AUTHTYPE.OPCO && (
                <BreadcrumbItem>
                  <BreadcrumbLink textDecoration="underline" onClick={() => router.push(getUserNavigationContext())} textStyle="xs">
                    Administration des offres
                  </BreadcrumbLink>
                </BreadcrumbItem>
              )}
              <BreadcrumbItem>
                <BreadcrumbLink textStyle="xs">Informations de contact</BreadcrumbLink>
              </BreadcrumbItem>
            </Breadcrumb>
          </Box>
          <Formik
            validateOnMount={true}
            enableReinitialize={true}
            initialValues={{
              last_name: data.data.last_name,
              first_name: data.data.first_name,
              phone: data.data.phone,
              email: data.data.email,
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
              if (auth.type === AUTHTYPE.ENTREPRISE) {
                // @ts-expect-error: TODO
                userMutation.mutate({ userId: data.data._id, establishment_id: auth.establishment_id, values })
              } else {
                // @ts-expect-error: TODO
                partenaireMutation.mutate({ userId: data.data._id, values })
              }
              toast({
                title: "Mise à jour enregistrée avec succès",
                position: "top-right",
                status: "success",
                duration: 2000,
                isClosable: true,
              })
              setSubmitting(false)
            }}
          >
            {({ values, isSubmitting, isValid }) => {
              return (
                <>
                  <SimpleGrid columns={[1, 1, 1, 2]} spacing={[0, 10]}>
                    <Box>
                      <Heading>Vos informations de contact</Heading>
                      <Text fontSize="20px" textAlign="justify">
                        {auth.type === AUTHTYPE.ENTREPRISE
                          ? "Vos informations de contact seront visibles sur les offres mises en ligne. Vous recevrez les candidatures sur l’email enregistré."
                          : "Vos informations de contact seront visibles sur les offres mises en ligne à partir de votre espace personnel La bonne alternance, pour vos entreprises partenaires."}
                      </Text>
                      {auth.type === AUTHTYPE.CFA && (
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
                      <InformationLegaleEntreprise {...data.data} />
                    </Box>
                  </SimpleGrid>
                </>
              )
            }}
          </Formik>
        </Container>
      </Layout>
    </AnimationContainer>
  )
}

export default withAuth(Compte)
