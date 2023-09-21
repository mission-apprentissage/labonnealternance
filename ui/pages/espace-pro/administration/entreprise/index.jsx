import {
  Alert,
  AlertIcon,
  Box,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Button,
  Container,
  Flex,
  Heading,
  Link as ChakraLink,
  SimpleGrid,
  Text,
  useBreakpointValue,
} from "@chakra-ui/react"
import { Form, Formik } from "formik"
import NavLink from "next/link"
import { useRouter } from "next/router"
import { useContext, useEffect, useState } from "react"
import * as Yup from "yup"

import useAuth from "../../../../common/hooks/useAuth"
import { SIRETValidation } from "../../../../common/validation/fieldValidations"
import { AnimationContainer, CustomInput, Layout } from "../../../../components/espace_pro"
import withAuth from "../../../../components/espace_pro/withAuth"
import { LogoContext } from "../../../../context/contextLogo"
import { WidgetContext } from "../../../../context/contextWidget"
import { InfoCircle, SearchLine } from "../../../../theme/components/icons"
import { getEntrepriseInformation, getEntrepriseOpco } from "../../../../utils/api"

const CreationCompte = () => {
  const [isCfa, setIsCfa] = useState(false)
  const buttonSize = useBreakpointValue(["sm", "md"])
  const router = useRouter()
  const [auth] = useAuth()

  const submitSiret = ({ establishment_siret }, { setSubmitting, setFieldError }) => {
    const formattedSiret = establishment_siret.replace(/[^0-9]/g, "")
    Promise.all([getEntrepriseOpco(formattedSiret), getEntrepriseInformation(formattedSiret, { cfa_delegated_siret: auth.cfa_delegated_siret })]).then(
      ([opcoInfos, entrepriseData]) => {
        if (entrepriseData.error) {
          if (entrepriseData.errorType === "server") {
            router.push({
              pathname: "/espace-pro/administration/entreprise/detail",
              query: { informationSiret: JSON.stringify({ establishment_siret: formattedSiret, ...opcoInfos }) },
            })
          } else {
            setFieldError("establishment_siret", entrepriseData.message)
            setIsCfa(entrepriseData?.isCfa)
            setSubmitting(false)
          }
        } else {
          setSubmitting(true)
          router.push({
            pathname: "/espace-pro/administration/entreprise/detail",
            query: { informationSiret: JSON.stringify({ ...entrepriseData, ...opcoInfos }) },
          })
        }
      }
    )
  }

  return (
    <Formik
      validateOnMount
      initialValues={{ establishment_siret: undefined }}
      validationSchema={Yup.object().shape({
        establishment_siret: SIRETValidation().required("champ obligatoire"),
      })}
      onSubmit={submitSiret}
    >
      {({ values, isValid, isSubmitting, setFieldValue, submitForm }) => {
        return (
          <>
            <Form>
              <CustomInput required={false} name="establishment_siret" label="SIRET" type="text" value={values.establishment_siret} />
              {isCfa && (
                <Alert status="info" variant="top-accent">
                  <AlertIcon />
                  <Text>
                    Pour les organismes de formation,{" "}
                    <ChakraLink
                      variant="classic"
                      onClick={() => {
                        setIsCfa(false)
                        setFieldValue("establishment_siret", values.establishment_siret)
                        router.push("/espace-pro/creation/cfa")
                        submitForm()
                      }}
                    >
                      veuillez utiliser ce lien
                    </ChakraLink>
                  </Text>
                </Alert>
              )}
              <Flex justify="flex-end" mt={5}>
                <Button
                  type="submit"
                  size={buttonSize}
                  variant="form"
                  leftIcon={<SearchLine width={5} />}
                  isActive={isValid}
                  isDisabled={!isValid || isSubmitting}
                  isLoading={isSubmitting}
                >
                  Chercher
                </Button>
              </Flex>
            </Form>
          </>
        )
      }}
    </Formik>
  )
}

const InformationSiret = () => (
  <Box border="1px solid #000091" p={["4", "8"]}>
    <Heading fontSize="24px" mb={3}>
      Où trouver votre SIRET ?
    </Heading>
    <Flex alignItems="flex-start">
      <InfoCircle mr={2} mt={1} />
      <Text textAlign="justify">
        Le numéro d’identification de votre entreprise peut être trouvé sur
        <ChakraLink href="https://annuaire-entreprises.data.gouv.fr/" variant="classic" isExternal>
          l’annuaire des entreprises
        </ChakraLink>
        ou bien sur les registres de votre entreprise.
      </Text>
    </Flex>
  </Box>
)

function CreationEntreprise({ type, widget }) {
  const { setWidget } = useContext(WidgetContext)
  const { setOrganisation } = useContext(LogoContext)
  const router = useRouter()

  // let mobile = searchParams.get("mobile") === "true" ? true : false
  // const [searchParams] = useSearchParams() // TODO_AB
  let mobile = router.query.mobile === "true" ? true : false

  useEffect(() => {
    if (widget) {
      setWidget((prev) => ({ ...prev, isWidget: true, mobile: mobile ?? false }))
      setOrganisation(router.query.origine ?? "matcha")
    }
    /* eslint react-hooks/exhaustive-deps: 0 */
  }, [])

  return (
    <AnimationContainer>
      <Container maxW="container.xl" mt={5}>
        <Box mb={5}>
          <Breadcrumb spacing="4px" textStyle="xs">
            <BreadcrumbItem isCurrentPage>
              <NavLink href="/espace-pro/administration" passHref>
                <BreadcrumbLink textStyle="xs"> Administration des offres</BreadcrumbLink>
              </NavLink>
            </BreadcrumbItem>
          </Breadcrumb>
        </Box>
        <SimpleGrid columns={[1, 1, 1, 2]} spacing={[0, 10]}>
          <Box>
            <Heading>Renseignements entreprise</Heading>
            <Text fontSize="20px" textAlign="justify" mt={2}>
              Merci de renseigner le SIRET de votre entreprise partenaire afin de l'identifier.
            </Text>
            <Box mt={4}>
              <CreationCompte />
            </Box>
          </Box>
          <Box>
            <InformationSiret type={type} />
          </Box>
        </SimpleGrid>
      </Container>
    </AnimationContainer>
  )
}

function CreationEntreprisePage() {
  return (
    <Layout footer={false}>
      <CreationEntreprise />
    </Layout>
  )
}
export default withAuth(CreationEntreprisePage)
