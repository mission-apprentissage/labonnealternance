import { Box, Button, Flex, FormControl, FormErrorMessage, FormHelperText, FormLabel, Heading, Select, SimpleGrid, Text, useBoolean, useDisclosure } from "@chakra-ui/react"
import { Form, Formik } from "formik"
import { useContext, useEffect, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import * as Yup from "yup"
import { createPartenaire } from "../../api"
import { AUTHTYPE } from "../../common/contants"
import { AnimationContainer, AuthentificationLayout, ConfirmationCreationCompte, CustomInput, InformationLegaleEntreprise, InformationOpco } from "../../components"
import { WidgetContext } from "../../contextWidget"
import { ArrowRightLine } from "../../theme/components/icons"
import logosOpco from "../../theme/components/logos/logosOpco"

const Formulaire = ({ submitForm, validateOpcoChoice }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { widget } = useContext(WidgetContext)

  const {
    establishment_raison_sociale,
    address,
    email,
    contacts,
    establishment_siret,
    geo_coordinates,
    opco,
    idcc,
    naf_code,
    naf_label,
    establishment_size,
    establishment_creation_date,
    address_detail
  } = location.state?.informationSiret
  const { type, origin } = location.state

  return (
    <Formik
      validateOnMount={true}
      initialValues={{
        establishment_siret: establishment_siret,
        establishment_raison_sociale: establishment_raison_sociale,
        address: address,
        address_detail: address_detail,
        contacts: contacts,
        geo_coordinates: geo_coordinates,
        opco: opco,
        idcc: idcc,
        type: type,
        naf_code: naf_code,
        naf_label: naf_label,
        establishment_size: establishment_size,
        establishment_creation_date: establishment_creation_date,
        origin: origin ?? "matcha",
        last_name: undefined,
        first_name: undefined,
        phone: undefined,
        email: email ? email : undefined,
      }}
      validationSchema={Yup.object().shape({
        establishment_raison_sociale: Yup.string().required("champs obligatoire"),
        establishment_siret: Yup.string()
          .matches(/^[0-9]+$/, "Le siret est composé uniquement de chiffres")
          .min(14, "le siret est sur 14 chiffres")
          .max(14, "le siret est sur 14 chiffres")
          .required("champs obligatoire"),
        address: Yup.string().required("champ obligatoire"),
        email: Yup.string().email("Insérez un email valide").lowercase().required("champ obligatoire"),
        last_name: Yup.string().required("champ obligatoire"),
        first_name: Yup.string().required("champ obligatoire"),
        phone: Yup.string()
          .matches(/^[0-9]+$/, "Le téléphone est composé uniquement de chiffres")
          .min(10, "le téléphone est sur 10 chiffres")
          .max(10, "le téléphone est sur 10 chiffres")
          .required("champ obligatoire"),
        type: Yup.string().default(type),
        opco: Yup.string().when("type", { is: (v) => v === AUTHTYPE.ENTREPRISE, then: Yup.string().required("champ obligatoire") }),
      })}
      onSubmit={submitForm}
    >
      {({ values, isValid, isSubmitting, setFieldValue, errors }) => {
        return (
          <Form>
            <CustomInput required={false} name="last_name" label="Nom" type="text" value={values.last_name} />
            <CustomInput required={false} name="first_name" label="Prénom" type="text" value={values.first_name} />
            <CustomInput
              required={false}
              name="phone"
              label="Numéro de téléphone"
              type="tel"
              pattern="[0-9]{10}"
              maxLength="10"
              helper={
                type === AUTHTYPE.ENTREPRISE
                  ? "Le numéro de téléphone sera visible sur l'offre d'emploi"
                  : "Le numéro de téléphone sera visible sur l’offre d’emploi de vos entreprises partenaires"
              }
              value={values.phone}
            />
            <CustomInput
              sx={{ textTransform: "lowercase" }}
              required={false}
              isDisabled={email ? true : false}
              name="email"
              label="Email"
              type="email"
              value={values.email}
              info={
                email
                  ? "L’email que nous utilisons est fourni par votre Carif Oref, et permet de vous connecter. Vous pourrez le modifier dans votre espace personnel."
                  : "Il s’agit de l’adresse qui vous permettra de vous connecter à votre compte. Privilégiez votre adresse professionnelle"
              }
            />
            {type === AUTHTYPE.ENTREPRISE && opco === undefined && (
              <FormControl>
                <FormLabel>OPCO</FormLabel>
                <FormHelperText pb={2}>Pour vous accompagner dans vos recrutements, votre OPCO accède à vos informations sur La bonne alternance.</FormHelperText>
                <Select variant="outline" size="md" name="opco" mr={3} onChange={(e) => setFieldValue("opco", e.target.value)} defaultValue={values.opco}>
                  <option hidden>Sélectionnez un OPCO</option>
                  <option value="AFDAS">AFDAS</option>
                  <option value="AKTO / Opco entreprises et salariés des services à forte intensité de main d'oeuvre">AKTO</option>
                  <option value="ATLAS">ATLAS</option>
                  <option value="Constructys">Constructys</option>
                  <option value="L'Opcommerce">L'Opcommerce</option>
                  <option value="OCAPIAT">OCAPIAT</option>
                  <option value="OPCO 2i">Opco 2i</option>
                  <option value="Opco entreprises de proximité">Opco EP</option>
                  <option value="Opco Mobilités">Opco Mobilités</option>
                  <option value="Opco Santé">Opco Santé</option>
                  <option value="Uniformation, l'Opco de la Cohésion sociale">Uniformation</option>
                  <option value="inconnu">Je ne sais pas</option>
                </Select>
                <FormErrorMessage>{errors.opco}</FormErrorMessage>
              </FormControl>
            )}
            <Flex justifyContent="flex-end" alignItems="center" mt={5}>
              {!widget?.isWidget && (
                <Button variant="link" sx={{ color: "black", fontWeight: 400 }} mr={5} onClick={() => navigate("/", { replace: true })}>
                  Annuler
                </Button>
              )}
              <Button
                type="submit"
                variant="form"
                leftIcon={<ArrowRightLine width={5} />}
                isActive={isValid && values.opco === undefined && type === "ENTREPRISE" ? validateOpcoChoice : isValid}
                isDisabled={!isValid || isSubmitting || (values.opco === undefined && type === "ENTREPRISE") ? !validateOpcoChoice : null}
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
  const navigate = useNavigate()
  const { type } = location.state
  const { widget } = useContext(WidgetContext)
  const validationPopup = useDisclosure()
  const [userData, setUserData] = useState()
  const [opcoChoice, setOpcoChoice] = useState()
  const [validateOpcoChoice, setValidateOpcoChoice] = useBoolean()
  const [informationOpco, setInformationOpco] = useState()

  const informationEntreprise = { ...location.state?.informationSiret, type: location.state?.type }

  useEffect(() => {
    if (location.state?.informationSiret.opco !== undefined) {
      setOpcoChoice(location.state?.informationSiret.opco)
      setValidateOpcoChoice.toggle()
    }
  }, [])

  useEffect(() => {
    const [informations] = logosOpco.filter((x) => x.nom === opcoChoice)
    setInformationOpco(informations)
  }, [validateOpcoChoice])

  const submitForm = (values, { setSubmitting, setFieldError }) => {
    if (opcoChoice !== undefined) {
      values = { ...values, opco: opcoChoice }
    }
    // save info if not trusted from source
    createPartenaire(values)
      .then(({ data }) => {
        if (data.user.status[0].status === "EN ATTENTE DE VALIDATION") {
          validationPopup.onOpen()
          setUserData(data)
        } else {
          if (data.user.type === AUTHTYPE.ENTREPRISE) {
            // Dépot simplifié
            navigate("/creation/offre", {
              replace: true,
              state: { establishment_id: data.formulaire.establishment_id, type, email: data.user.email, userId: data.user._id },
            })
          } else {
            navigate("/authentification/confirmation", { replace: true, state: { email: data.email } })
          }
        }

        setSubmitting(false)
      })
      .catch((error) => {
        console.log(error)
        setFieldError("email", error?.response?.data?.message)
        setSubmitting(false)
      })
  }

  const resetOpcoChoice = () => {
    setOpcoChoice()
    setValidateOpcoChoice.off()
    setInformationOpco()
  }

  return (
    <AnimationContainer>
      <ConfirmationCreationCompte {...userData} {...validationPopup} validateManualOpco={validateOpcoChoice} />
      <AuthentificationLayout>
        <SimpleGrid columns={[1, 1, 1, 2]} spacing={["35px", "35px", "35px", "75px"]} mt={widget.isWidget ? 0 : 12}>
          <Box>
            {widget.isWidget && (
              <Text textTransform="uppercase" fontSize="20px" color="#666666">
                Dépot simplifié d'offre en alternance
              </Text>
            )}
            <Heading>{type === AUTHTYPE.ENTREPRISE ? "Vos informations de contact" : "Créez votre compte"}</Heading>
            <Box fontSize="20px" mb={4}>
              <Text textAlign="justify" mt={2}>
                {type === AUTHTYPE.ENTREPRISE
                  ? "Les informations de contact seront visibles sur vos offres et permettront de recevoir les candidatures."
                  : "Les informations de contact seront visibles sur les offres de vos entreprises partenaires"}
              </Text>
              <Text>Elles peuvent être modifiées ultérieurement.</Text>
            </Box>
            <Box>
              <Formulaire validateOpcoChoice={validateOpcoChoice} submitForm={submitForm} />
            </Box>
          </Box>
          <Box>
            <InformationLegaleEntreprise {...informationEntreprise} />
            {informationOpco && <InformationOpco disabled={location.state?.informationSiret.opco} informationOpco={informationOpco} resetOpcoChoice={resetOpcoChoice} />}
          </Box>
        </SimpleGrid>
      </AuthentificationLayout>
    </AnimationContainer>
  )
}
