import { Box, Button, Flex, FormControl, FormErrorMessage, FormHelperText, FormLabel, Heading, SimpleGrid, Text } from "@chakra-ui/react"
import { Form, Formik } from "formik"
import { useRouter } from "next/router"
import { useContext } from "react"
import { assertUnreachable, parseEnum } from "shared"
import { CFA, ENTREPRISE, OPCOS_LABEL } from "shared/constants/recruteur"
import * as Yup from "yup"

import { ApiError } from "@/utils/api.utils"

import { AUTHTYPE } from "../../../common/contants"
import { phoneValidation } from "../../../common/validation/fieldValidations"
import { WidgetContext } from "../../../context/contextWidget"
import { ArrowRightLine } from "../../../theme/components/icons"
import logosOpco from "../../../theme/components/logos/opcos"
import { createEtablissement } from "../../../utils/api"
import { OpcoSelect } from "../CreationRecruteur/OpcoSelect"
import { AnimationContainer, AuthentificationLayout, CustomInput, InformationLegaleEntreprise, InformationOpco } from "../index"

const Formulaire = ({ submitForm }) => {
  const router = useRouter()
  const { widget } = useContext(WidgetContext)

  const { type, informationSiret: informationSiretString, origin }: { type: string; informationSiret: string; origin: string } = router.query as any
  const informationSiret = JSON.parse(informationSiretString || "{}")

  const { email = "", establishment_siret = "" } = informationSiret ?? {}
  const opco = parseEnum(OPCOS_LABEL, informationSiret.opco)
  const shouldSelectOpco = type === AUTHTYPE.ENTREPRISE && !opco

  return (
    <Formik
      validateOnMount={true}
      initialValues={{
        opco: opco ?? "",
        last_name: "",
        first_name: "",
        phone: "",
        email,
        origin: origin ?? "lba",
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
                  <CustomInput required={false} name="phone" label="Numéro de téléphone" type="tel" pattern="[0-9]{10}" maxLength="10" value={values.phone} />
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
                        : "Privilégiez votre adresse professionnelle"
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
                  <InformationLegaleEntreprise siret={establishment_siret} type={type as typeof CFA | typeof ENTREPRISE} opco={opco} />
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
  const router = useRouter()
  const { type } = router.query

  return (
    <SimpleGrid columns={[1, 1, 2, 2]} spacing={4} mt={0}>
      <Box>
        <Heading>{type === AUTHTYPE.ENTREPRISE ? "Vos informations de contact" : "Créez votre compte"}</Heading>
        <Box fontSize="20px" mb={4}>
          <Text className="big" mt={2} mb={4}>
            {type === AUTHTYPE.ENTREPRISE
              ? "Seul le numéro de téléphone sera visible sur vos offres. Vous recevrez les candidatures sur l'email renseigné."
              : "Seul le numéro de téléphone sera visible sur les offres de vos entreprises partenaires. Vous recevrez les candidatures sur l'email renseigné."}
          </Text>
        </Box>
        <Box>{left}</Box>
      </Box>
      <Box>{right}</Box>
    </SimpleGrid>
  )
}

export const InformationCreationCompte = ({ isWidget = false }: { isWidget?: boolean }) => {
  const router = useRouter()

  const { type, informationSiret: informationSiretString }: { type: "CFA" | "ENTREPRISE"; informationSiret: string } = router.query as any
  const informationSiret = JSON.parse(informationSiretString || "{}")
  const { establishment_siret } = informationSiret

  const submitForm = (values, { setSubmitting, setFieldError }) => {
    const payload = { ...values, type, establishment_siret }
    if (type === AUTHTYPE.CFA) {
      payload.opco = OPCOS_LABEL.UNKNOWN_OPCO
    }
    createEtablissement(payload)
      .then((data) => {
        if (!data) {
          throw new Error("no data")
        }
        const { user, formulaire, token, validated } = data

        if (!user) {
          throw new Error("unexpected: data.user is empty")
        }

        switch (type) {
          case AUTHTYPE.ENTREPRISE: {
            router.push({
              pathname: isWidget ? "/espace-pro/widget/entreprise/offre" : "/espace-pro/creation/offre",
              query: { establishment_id: formulaire.establishment_id, type, email: user.email, userId: user._id.toString(), token, displayBanner: !validated },
            })
            break
          }
          case AUTHTYPE.CFA: {
            if (validated) {
              router.push({
                pathname: "/espace-pro/authentification/confirmation",
                query: { email: user.email },
              })
            } else {
              router.push("/espace-pro/authentification/en-attente")
            }
            break
          }
          default:
            assertUnreachable(type)
            break
        }
        setSubmitting(false)
      })
      .catch((error) => {
        if (error instanceof ApiError) {
          setFieldError("email", error.message)
          setSubmitting(false)
        }
      })
  }

  return (
    <AnimationContainer>
      <AuthentificationLayout>
        <Formulaire submitForm={submitForm} />
      </AuthentificationLayout>
    </AnimationContainer>
  )
}
