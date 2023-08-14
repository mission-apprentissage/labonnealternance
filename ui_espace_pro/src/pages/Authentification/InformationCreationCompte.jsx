import { Box, Button, Flex, FormControl, FormErrorMessage, FormHelperText, FormLabel, Heading, Select, SimpleGrid, Text, useBoolean, useDisclosure } from "@chakra-ui/react"
import { Form, Formik } from "formik"
import { useContext, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import * as Yup from "yup"
import { createPartenaire } from "../../api"
import { AUTHTYPE } from "../../common/contants"
import { AnimationContainer, AuthentificationLayout, ConfirmationCreationCompte, CustomInput, InformationLegaleEntreprise, InformationOpco } from "../../components"
import { WidgetContext } from "../../contextWidget"
import { ArrowRightLine } from "../../theme/components/icons"
import logosOpco from "../../theme/components/logos/logosOpco"

const Formulaire = ({ submitForm }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { widget } = useContext(WidgetContext)

  const { type, informationSiret, origin } = location.state ?? {}
  const { email = "", opco = "" } = informationSiret ?? {}
  const shouldSelectOpco = type === AUTHTYPE.ENTREPRISE && !opco
  const informationEntreprise = { ...informationSiret, type }

  return (
    <Formik
      validateOnMount={true}
      initialValues={{
        opco,
        last_name: "",
        first_name: "",
        phone: "",
        email,
        origin: origin ?? "matcha",
      }}
      validationSchema={Yup.object().shape({
        last_name: Yup.string().required("champ obligatoire"),
        first_name: Yup.string().required("champ obligatoire"),
        phone: Yup.string()
          .matches(/^[0-9]+$/, "Le téléphone est composé uniquement de chiffres")
          .min(10, "le téléphone est sur 10 chiffres")
          .max(10, "le téléphone est sur 10 chiffres")
          .required("champ obligatoire"),
        email: Yup.string().email("Insérez un email valide").lowercase().required("champ obligatoire"),
        opco: shouldSelectOpco ? Yup.string().required("champ obligatoire") : Yup.string(),
      })}
      onSubmit={submitForm}
    >
      {({ values, isValid, isSubmitting, setFieldValue, errors }) => {
        const informationOpco = logosOpco.find((x) => x.nom === values.opco)
        return (
          <Form>
            <FormulaireLayout
              left={
                <>
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
                  {shouldSelectOpco && (
                    <FormControl>
                      <FormLabel>OPCO</FormLabel>
                      <FormHelperText pb={2}>Pour vous accompagner dans vos recrutements, votre OPCO accède à vos informations sur La bonne alternance.</FormHelperText>
                      <Select variant="outline" size="md" name="opco" mr={3} onChange={(e) => setFieldValue("opco", e.target.value)} value={values.opco}>
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
                    <Button type="submit" variant="form" leftIcon={<ArrowRightLine width={5} />} isActive={isValid} isDisabled={!isValid || isSubmitting}>
                      Suivant
                    </Button>
                  </Flex>
                </>
              }
              right={
                <>
                  <InformationLegaleEntreprise {...informationEntreprise} />
                  {informationOpco && <InformationOpco disabled={!shouldSelectOpco} informationOpco={informationOpco} resetOpcoChoice={() => setFieldValue("opco", "")} />}
                </>
              }
            />
          </Form>
        )
      }}
    </Formik>
  )
}

const FormulaireLayout = ({ left, right }) => {
  const location = useLocation()
  const { widget } = useContext(WidgetContext)
  const { type } = location.state

  return (
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
        <Box>{left}</Box>
      </Box>
      <Box>{right}</Box>
    </SimpleGrid>
  )
}

export const InformationCreationCompte = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const validationPopup = useDisclosure()
  const [userData, setUserData] = useState()

  const { type, informationSiret } = location.state ?? {}

  const submitForm = (values, { setSubmitting, setFieldError }) => {
    // save info if not trusted from source
    createPartenaire({ ...informationSiret, ...values, type })
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
        console.error(error)
        setFieldError("email", error?.response?.data?.message)
        setSubmitting(false)
      })
  }

  return (
    <AnimationContainer>
      <ConfirmationCreationCompte {...userData} {...validationPopup} />
      <AuthentificationLayout>
        <Formulaire submitForm={submitForm} />
      </AuthentificationLayout>
    </AnimationContainer>
  )
}

export default InformationCreationCompte
