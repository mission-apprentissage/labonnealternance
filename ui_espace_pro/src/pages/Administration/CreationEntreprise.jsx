import { Alert, AlertIcon, Box, Breadcrumb, BreadcrumbItem, BreadcrumbLink, Button, Container, Flex, Heading, Link, SimpleGrid, Text, useBreakpointValue } from "@chakra-ui/react"
import { Form, Formik } from "formik"
import { useContext, useState } from "react"
import { NavLink, useNavigate, useParams, useSearchParams } from "react-router-dom"
import * as Yup from "yup"
import { getEntrepriseInformation } from "../../api"
import useAuth from "../../common/hooks/useAuth"
import { AnimationContainer, CustomInput } from "../../components"
import { LogoContext } from "../../contextLogo"
import { WidgetContext } from "../../contextWidget"
import { InfoCircle, SearchLine } from "../../theme/components/icons"

const CreationCompte = ({ type }) => {
  const [isCfa, setIsCfa] = useState(false)
  const buttonSize = useBreakpointValue(["sm", "md"])
  const navigate = useNavigate()
  const [auth] = useAuth()

  const submitSiret = ({ siret }, { setSubmitting, setFieldError }) => {
    const formatedSiret = siret.split(" ").join("")
    // validate SIRET
    getEntrepriseInformation(formatedSiret, { fromDashboardCfa: true, gestionnaire: auth.gestionnaire })
      .then(({ data }) => {
        setSubmitting(true)
        navigate("/administration/entreprise/detail", {
          state: { informationSiret: data },
        })
      })
      .catch(({ response }) => {
        setFieldError("siret", response.data.message)
        setIsCfa(response.data?.isCfa)
        setSubmitting(false)
      })
  }

  return (
    <Formik
      validateOnMount
      initialValues={{ siret: undefined }}
      validationSchema={Yup.object().shape({
        siret: Yup.string()
          .transform((value) => value.split(" ").join(""))
          .matches(/^[0-9]+$/, "Le siret est composé uniquement de chiffres")
          .min(14, "le siret est sur 14 chiffres")
          .max(14, "le siret est sur 14 chiffres")
          .required("champ obligatoire"),
      })}
      onSubmit={submitSiret}
    >
      {({ values, isValid, isSubmitting, setFieldValue, submitForm }) => {
        return (
          <>
            <Form>
              <CustomInput required={false} name="siret" label="SIRET" type="text" value={values.siret} />
              {isCfa && (
                <Alert status="info" variant="top-accent">
                  <AlertIcon />
                  {/* <Flex> */}
                  <Text>
                    Pour les organismes de formation,{" "}
                    <Link
                      variant="classic"
                      onClick={() => {
                        setIsCfa(false)
                        setFieldValue("siret", values.siret)
                        navigate("/creation/cfa")
                        submitForm()
                      }}
                    >
                      veuillez utiliser ce lien
                    </Link>
                  </Text>
                  {/* </Flex> */}
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
        <Link href="https://annuaire-entreprises.data.gouv.fr/" variant="classic" isExternal>
          l’annuaire des entreprises
        </Link>
        ou bien sur les registres de votre entreprise.
      </Text>
    </Flex>
  </Box>
)

export default ({ type, widget, administration }) => {
  const { setWidget, widget: wid } = useContext(WidgetContext)
  const { setOrganisation } = useContext(LogoContext)
  const params = useParams()
  const [searchParams] = useSearchParams()

  let mobile = searchParams.get("mobile") === "true" ? true : false

  useState(() => {
    if (widget) {
      setWidget((prev) => ({ ...prev, isWidget: true, mobile: mobile ?? false }))
      setOrganisation(params.origine ?? "matcha")
    }
  }, [])

  return (
    <AnimationContainer>
      <Container maxW="container.xl" mt={5}>
        <Box mb={5}>
          <Breadcrumb spacing="4px" textStyle="xs">
            <BreadcrumbItem isCurrentPage>
              <BreadcrumbLink as={NavLink} to="/administration" textStyle="xs">
                Administration des offres
              </BreadcrumbLink>
            </BreadcrumbItem>
          </Breadcrumb>
        </Box>
        <SimpleGrid columns={[1, 1, 1, 2]} spacing={[0, 10]}>
          <Box>
            <Heading>Renseignements entreprise</Heading>
            <Text fontSize="20px" textAlign="justify" mt={2}>
              Merci de renseigner le siret de votre entreprise partenaire.
            </Text>
            <Box mt={4}>
              <CreationCompte type={type} />
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
