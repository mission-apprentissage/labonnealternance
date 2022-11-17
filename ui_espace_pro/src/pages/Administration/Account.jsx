import { Box, Breadcrumb, BreadcrumbItem, BreadcrumbLink, Button, Container, Flex, Heading, SimpleGrid, Text, useToast } from "@chakra-ui/react"
import { Form, Formik } from "formik"
import { useMutation, useQuery, useQueryClient } from "react-query"
import { useNavigate } from "react-router-dom"
import * as Yup from "yup"
import { getUser, updateEntreprise, updatePartenaire } from "../../api"
import { AUTHTYPE } from "../../common/contants"
import useAuth from "../../common/hooks/useAuth"
import { AnimationContainer, CustomInput, InformationLegaleEntreprise, Layout } from "../../components"
import { ArrowDropRightLine, ArrowRightLine } from "../../theme/components/icons"

export default () => {
  const navigate = useNavigate()
  const client = useQueryClient()
  const toast = useToast()
  const [auth] = useAuth()

  const getUserNavigationContext = () => {
    switch (auth.type) {
      case AUTHTYPE.ENTREPRISE:
        return `/administration/entreprise/${auth.id_form}`
      case AUTHTYPE.CFA:
        return `/administration`
      default:
        break
    }
  }

  const { data, isLoading } = useQuery("user", () => getUser(auth.id))

  const userMutation = useMutation(({ userId, formId, values }) => updateEntreprise(userId, formId, values), {
    onSuccess: () => {
      client.invalidateQueries("user")
    },
  })
  const partenaireMutation = useMutation(({ userId, values }) => updatePartenaire(userId, values), {
    onSuccess: () => {
      client.invalidateQueries("user")
    },
  })

  if (isLoading) {
    return "Chargement en cours..."
  }

  return (
    <AnimationContainer>
      <Layout>
        <Container maxW="container.xl">
          <Box mt="16px" mb={6}>
            <Breadcrumb separator={<ArrowDropRightLine color="grey.600" />} textStyle="xs">
              {auth.type !== AUTHTYPE.OPCO && (
                <BreadcrumbItem>
                  <BreadcrumbLink textDecoration="underline" onClick={() => navigate(getUserNavigationContext())} textStyle="xs">
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
              nom: data.data.nom,
              prenom: data.data.prenom,
              telephone: data.data.telephone,
              email: data.data.email,
            }}
            validationSchema={Yup.object().shape({
              nom: Yup.string().required("champ obligatoire"),
              prenom: Yup.string().required("champ obligatoire"),
              telephone: Yup.string()
                .matches(/^[0-9]+$/, "Le téléphone est composé uniquement de chiffres")
                .min(10, "le téléphone est sur 10 chiffres")
                .max(10, "le téléphone est sur 10 chiffres")
                .required("champ obligatoire"),
              email: Yup.string().email("Insérez un email valide").required("champ obligatoire"),
            })}
            onSubmit={async (values, { setSubmitting }) => {
              setSubmitting(true)
              if (auth.type === AUTHTYPE.ENTREPRISE) {
                userMutation.mutate({ userId: data.data._id, formId: auth.id_form, values })
              } else {
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
                          : "Vos informations de contact seront visibles sur les offres mises en ligne à partir de votre espace personnel La Bonne Alternance, pour vos entreprises partenaires."}
                      </Text>
                      {auth.type === AUTHTYPE.CFA && (
                        <Text fontSize="20px" textAlign="justify" mt={2}>
                          Vous recevrez les candidatures sur l’email enregistré.
                        </Text>
                      )}
                      <Box mt={4}>
                        <Form>
                          <CustomInput name="nom" label="Nom" type="text" value={values.nom} />
                          <CustomInput name="prenom" label="Prénom" type="test" value={values.prenom} />
                          <CustomInput name="telephone" label="Téléphone" type="tel" pattern="[0-9]{10}" maxLength="10" value={values.telephone} />
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
