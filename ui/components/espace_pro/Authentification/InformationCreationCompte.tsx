import { Box, Button, Flex, FormControl, FormErrorMessage, FormHelperText, FormLabel, Heading, SimpleGrid, Text, useDisclosure } from "@chakra-ui/react"
import { Form, Formik } from "formik"
import { useRouter } from "next/router"
import { useContext, useState } from "react"
import * as Yup from "yup"

import { AUTHTYPE } from "../../../common/contants"
import { phoneValidation } from "../../../common/validation/fieldValidations"
import { WidgetContext } from "../../../context/contextWidget"
import { ArrowRightLine } from "../../../theme/components/icons"
import logosOpco from "../../../theme/components/logos_pro/logosOpco"
import { createPartenaire } from "../../../utils/api"
import { OpcoSelect } from "../CreationRecruteur/OpcoSelect"
import { AnimationContainer, AuthentificationLayout, ConfirmationCreationCompte, CustomInput, InformationLegaleEntreprise, InformationOpco } from "../index"

const Formulaire = ({ submitForm }) => {
  const router = useRouter()
  const { widget } = useContext(WidgetContext)

  const { type, informationSiret: informationSiretString, origin }: { type: string; informationSiret: string; origin: string } = router.query as any
  const informationSiret = JSON.parse(informationSiretString || "{}")

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
        phone: phoneValidation().required("champ obligatoire"),
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
                      <OpcoSelect name="opco" onChange={(newValue) => setFieldValue("opco", newValue)} value={values.opco} />
                      <FormErrorMessage>{errors.opco as string}</FormErrorMessage>
                    </FormControl>
                  )}
                  <Flex justifyContent="flex-end" alignItems="center" mt={5}>
                    {!widget?.isWidget && (
                      <Button variant="link" sx={{ color: "black", fontWeight: 400 }} mr={5} onClick={() => router.back()}>
                        Annuler {/* TODO_AB */}
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
  const { widget } = useContext(WidgetContext)
  const router = useRouter()
  // const location = useLocation()
  // const { type } = location.state
  const { type } = router.query
  // TODO_AB

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
  // const location = useLocation()
  const router = useRouter()
  const validationPopup = useDisclosure()
  const [popupData, setPopupData] = useState({})

  const { type, informationSiret: informationSiretString }: { type: string; informationSiret: string } = router.query as any
  const informationSiret = JSON.parse(informationSiretString || "{}")
  const { establishment_siret } = informationSiret

  const submitForm = (values, { setSubmitting, setFieldError }) => {
    // save info if not trusted from source
    createPartenaire({ ...values, type, establishment_siret })
      .then(({ data }) => {
        if (data.user.status[0].status === "VALIDÉ") {
          if (data.user.type === AUTHTYPE.ENTREPRISE) {
            // Dépot simplifié
            router.push({
              pathname: "/espace-pro/creation/offre",
              query: { establishment_id: data.formulaire.establishment_id, type, email: data.user.email, userId: data.user._id },
            })
          } else {
            router.push({
              pathname: "/espace-pro/authentification/confirmation",
              query: { email: data.user.email },
            })
          }
        } else {
          validationPopup.onOpen()
          setPopupData({ ...data, type })
        }
        setSubmitting(false)
      })
      .catch(({ response }) => {
        const payload: { error: string; statusCode: number; message: string } = response.data
        console.error(payload.error)
        setFieldError("email", payload.message)
        setSubmitting(false)
      })
  }

  return (
    <AnimationContainer>
      <ConfirmationCreationCompte {...popupData} {...validationPopup} />
      <AuthentificationLayout>
        <Formulaire submitForm={submitForm} />
      </AuthentificationLayout>
    </AnimationContainer>
  )
}

export default InformationCreationCompte
