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

const Formulaire = () => {
  const buttonSize = useBreakpointValue(["sm", "md"])
  let navigate = useNavigate()
  let location = useLocation()
  const { widget } = useContext(WidgetContext)
  const { raison_sociale, adresse, contacts, siret, geo_coordonnees, opco, idcc, code_naf, libelle_naf, tranche_effectif, date_creation_etablissement } =
    location.state?.informationSiret
  const toast = useToast()
  const [auth] = useAuth()

  const submitForm = (values, { setSubmitting, setFieldError }) => {
    // save info if not trusted from source
    postFormulaire(values)
      .then(({ data }) => {
        toast({
          title: "Entreprise créé avec succès.",
          position: "top-right",
          status: "success",
          duration: 4000,
        })
        navigate(`/administration/entreprise/${data.id_form}`, {
          replace: true,
        })

        setSubmitting(false)
      })
      .catch((error) => {
        setFieldError("email", error.response.data.message)
        setSubmitting(false)
      })
  }

  return (
    <Formik
      validateOnMount={true}
      initialValues={{
        mandataire: true,
        gestionnaire: auth.gestionnaire,
        siret: siret,
        raison_sociale: raison_sociale,
        adresse: adresse,
        contacts: contacts,
        geo_coordonnees: geo_coordonnees,
        opco: opco,
        idcc: idcc,
        code_naf: code_naf,
        libelle_naf: libelle_naf,
        tranche_effectif: tranche_effectif,
        date_creation_etablissement: date_creation_etablissement,
        origine: auth.scope,
        nom: undefined,
        prenom: undefined,
        telephone: undefined,
        email: undefined,
      }}
      validationSchema={Yup.object().shape({
        raison_sociale: Yup.string().required("champs obligatoire"),
        siret: Yup.string()
          .matches(/^[0-9]+$/, "Le siret est composé uniquement de chiffres")
          .min(14, "le siret est sur 14 chiffres")
          .max(14, "le siret est sur 14 chiffres")
          .required("champs obligatoire"),
        adresse: Yup.string().required("champ obligatoire"),
        email: Yup.string().email("Insérez un email valide").required("champ obligatoire"),
        nom: Yup.string().required("champ obligatoire"),
        prenom: Yup.string().required("champ obligatoire"),
        telephone: Yup.string()
          .matches(/^[0-9]+$/, "Le téléphone est composé uniquement de chiffres")
          .min(10, "le téléphone est sur 10 chiffres")
          .max(10, "le téléphone est sur 10 chiffres")
          .required("champ obligatoire"),
      })}
      onSubmit={submitForm}
    >
      {(informationForm) => {
        return (
          <Form>
            <CustomInput required={false} name="nom" label="Nom" type="text" value={informationForm.values.nom} />
            <CustomInput required={false} name="prenom" label="Prénom" type="text" value={informationForm.values.prenom} />
            <CustomInput
              required={false}
              name="telephone"
              label="Numéro de téléphone"
              type="tel"
              pattern="[0-9]{10}"
              maxLength="10"
              helper="Le numéro de téléphone sera visible sur l'offre d'emploi"
              value={informationForm.values.telephone}
            />
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

export default () => {
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
            <Heading>Vos informations de contact</Heading>
            <Text fontSize="20px" textAlign="justify" mt={2}>
              il s’agit de l’entreprise qui vous a mandaté pour gérer ses offres d’emploi. Ces informations ne seront pas visibles sur l'offre.
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
