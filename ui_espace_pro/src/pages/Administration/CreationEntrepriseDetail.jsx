import {
  Box,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Button,
  Container,
  Flex,
  Grid,
  GridItem,
  Heading,
  Link as ChakraLink,
  Text,
  useBreakpointValue,
  useToast,
} from "@chakra-ui/react"
import { Form, Formik } from "formik"
import { useContext } from "react"
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom"
import * as Yup from "yup"
import { postFormulaire } from "../../api"
import { AUTHTYPE } from "../../common/contants"
import useAuth from "../../common/hooks/useAuth"
import { AnimationContainer, CustomInput, InformationLegaleEntreprise } from "../../components"
import { WidgetContext } from "../../contextWidget"
import { ArrowDropRightLine, ArrowRightLine } from "../../theme/components/icons"
import { SIRETValidation, phoneValidation } from "../../common/validation/fieldValidations"

const Formulaire = () => {
  const buttonSize = useBreakpointValue(["sm", "md"])
  let navigate = useNavigate()
  let location = useLocation()
  const { widget } = useContext(WidgetContext)
  const {
    establishment_raison_sociale,
    address,
    contacts,
    establishment_siret,
    geo_coordinates,
    opco,
    idcc,
    naf_code,
    naf_label,
    establishment_size,
    establishment_creation_date,
  } = location.state?.informationSiret
  const toast = useToast()
  const [auth] = useAuth()

  const submitForm = (values, { setSubmitting, setFieldError }) => {
    // save info if not trusted from source
    postFormulaire(values)
      .then(({ data }) => {
        setSubmitting(false)
        toast({
          title: "Entreprise créée avec succès.",
          position: "top-right",
          status: "success",
          duration: 4000,
        })
        navigate(`/administration/entreprise/${data.establishment_id}/offre/creation`, {
          replace: true,
          state: { establishment_raison_sociale: data.establishment_raison_sociale },
        })
      })
      .catch((error) => {
        setFieldError("email", error.response?.data?.message)
        setSubmitting(false)
      })
  }

  return (
    <Formik
      validateOnMount={true}
      initialValues={{
        is_delegated: true,
        cfa_delegated_siret: auth.cfa_delegated_siret,
        establishment_siret: establishment_siret,
        establishment_raison_sociale: establishment_raison_sociale,
        address: address,
        contacts: contacts,
        geo_coordinates: geo_coordinates,
        opco: opco,
        idcc: idcc,
        naf_code: naf_code,
        naf_label: naf_label,
        establishment_size: establishment_size,
        establishment_creation_date: establishment_creation_date,
        origin: auth.scope,
        last_name: undefined,
        first_name: undefined,
        phone: undefined,
        email: undefined,
      }}
      validationSchema={Yup.object().shape({
        establishment_raison_sociale: Yup.string().required("champs obligatoire"),
        establishment_siret: SIRETValidation().required("champs obligatoire"),
        address: Yup.string().required("champ obligatoire"),
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
                <ChakraLink as={Link} size={buttonSize} variant="secondary" mr={5} to="/administration">
                  Annuler
                </ChakraLink>
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

export const CreationEntrepriseDetail = () => {
  const location = useLocation()
  const informationEntreprise = { ...location.state?.informationSiret, type: AUTHTYPE.ENTREPRISE }

  return (
    <AnimationContainer>
      <Container maxW="container.xl" my={5}>
        <Box mb={5}>
          <Breadcrumb separator={<ArrowDropRightLine color="grey.600" />} spacing="4px" textStyle="xs">
            <BreadcrumbItem>
              <BreadcrumbLink as={NavLink} to="/administration" textStyle="xs">
                Administration des offres
              </BreadcrumbLink>
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
            <Formulaire />
          </GridItem>
          <GridItem rowStart={["auto", 2]} pt={[4, 8]} minW="0">
            <InformationLegaleEntreprise {...informationEntreprise} />
          </GridItem>
        </Grid>
      </Container>
    </AnimationContainer>
  )
}

export default CreationEntrepriseDetail
