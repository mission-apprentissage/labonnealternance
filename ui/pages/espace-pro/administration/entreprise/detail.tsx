import { Box, Breadcrumb, BreadcrumbItem, BreadcrumbLink, Button, Container, Flex, Grid, GridItem, Heading, Text, useBreakpointValue, useToast } from "@chakra-ui/react"
import { Form, Formik } from "formik"
import NavLink from "next/link"
import { useRouter } from "next/router"
import { useContext } from "react"
import { ENTREPRISE } from "shared/constants/recruteur"
import * as Yup from "yup"

import { getAuthServerSideProps } from "@/common/SSR/getAuthServerSideProps"
import { useAuth } from "@/context/UserContext"

import { phoneValidation } from "../../../../common/validation/fieldValidations"
import { AnimationContainer, CustomInput, InformationLegaleEntreprise, Layout } from "../../../../components/espace_pro"
import { authProvider, withAuth } from "../../../../components/espace_pro/withAuth"
import Link from "../../../../components/Link"
import { WidgetContext } from "../../../../context/contextWidget"
import { ArrowDropRightLine, ArrowRightLine } from "../../../../theme/components/icons"
import { postFormulaire } from "../../../../utils/api"

const Formulaire = ({ siret: establishment_siret }: { siret: string }) => {
  const buttonSize = useBreakpointValue(["sm", "md"])
  const router = useRouter()
  const { widget } = useContext(WidgetContext)
  const toast = useToast()
  const { user } = useAuth()

  const submitForm = (values, { setSubmitting, setFieldError }) => {
    postFormulaire(user._id.toString(), { ...values, establishment_siret })
      .then((data) => {
        setSubmitting(false)
        toast({
          title: "Entreprise créée avec succès.",
          position: "top-right",
          status: "success",
          duration: 4000,
        })
        router.push({
          pathname: `/espace-pro/administration/entreprise/${data.establishment_id}/offre/creation`,
          query: { establishment_raison_sociale: data.establishment_raison_sociale },
        })
      })
      .catch(({ response }) => {
        const payload: { error: string; statusCode: number; message: string } = response.data as any
        setFieldError("email", payload.message)
        setSubmitting(false)
      })
  }

  return (
    <Formik
      validateOnMount={true}
      initialValues={{
        last_name: undefined,
        first_name: undefined,
        phone: undefined,
        email: undefined,
      }}
      validationSchema={Yup.object().shape({
        email: Yup.string().email("Insérez un email valide").required("champ obligatoire"),
        last_name: Yup.string().required("champ obligatoire"),
        first_name: Yup.string().required("champ obligatoire"),
        phone: phoneValidation().required("champ obligatoire"),
      })}
      onSubmit={submitForm}
    >
      {(informationForm) => {
        return (
          <Form>
            <CustomInput required={false} name="last_name" label="Nom" type="text" value={informationForm.values.last_name} />
            <CustomInput required={false} name="first_name" label="Prénom" type="text" value={informationForm.values.first_name} />
            <CustomInput required={false} name="phone" label="Numéro de téléphone" type="tel" pattern="[0-9]{10}" maxLength="10" value={informationForm.values.phone} />
            <CustomInput required={false} name="email" label="Email" type="email" value={informationForm.values.email} />
            <Flex justifyContent="flex-end" alignItems="center" mt={5}>
              {!widget?.isWidget && (
                <Link href="/espace-pro/administration" variant="secondary" mr={5} size={buttonSize}>
                  Annuler
                </Link>
              )}
              <Button
                type="submit"
                size={buttonSize}
                variant="form"
                leftIcon={<ArrowRightLine width={5} />}
                isActive={informationForm.isValid}
                isDisabled={!informationForm.isValid || informationForm.isSubmitting}
              >
                Suivant
              </Button>
            </Flex>
          </Form>
        )
      }}
    </Formik>
  )
}

function CreationEntrepriseDetail({ siret }: { siret: string }) {
  return (
    <AnimationContainer>
      <Container maxW="container.xl" my={5}>
        <Box mb={5}>
          <Breadcrumb separator={<ArrowDropRightLine color="grey.600" />} spacing="4px" textStyle="xs">
            <BreadcrumbItem>
              <NavLink legacyBehavior href="/espace-pro/administration" passHref>
                <BreadcrumbLink textStyle="xs"> Administration des offres</BreadcrumbLink>
              </NavLink>
            </BreadcrumbItem>
            <BreadcrumbItem isCurrentPage>
              <BreadcrumbLink textStyle="xs">Nouvelle Entreprise</BreadcrumbLink>
            </BreadcrumbItem>
          </Breadcrumb>
        </Box>
        <Grid templateRows={["1fr", ".5fr 2fr"]} templateColumns={["1fr", "4fr 5fr"]} gap={6}>
          <GridItem>
            <Heading>Informations de contact</Heading>
            <Text fontSize="20px" textAlign="justify" mt={2}>
              Il s’agit des informations de contact de votre entreprise partenaire. Ces informations ne seront pas visibles sur l’offre.
            </Text>
          </GridItem>
          <GridItem rowStart={["auto", 2]}>
            <Formulaire siret={siret} />
          </GridItem>
          <GridItem rowStart={["auto", 2]} pt={[4, 8]} minW="0">
            <InformationLegaleEntreprise siret={siret} type={ENTREPRISE} />
          </GridItem>
        </Grid>
      </Container>
    </AnimationContainer>
  )
}
function CreationEntrepriseDetailPage() {
  const router = useRouter()
  const { siret } = router.query as { siret: string }

  return (
    <Layout footer={false}>
      <CreationEntrepriseDetail siret={siret} />
    </Layout>
  )
}

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } })

export default authProvider(withAuth(CreationEntrepriseDetailPage))
