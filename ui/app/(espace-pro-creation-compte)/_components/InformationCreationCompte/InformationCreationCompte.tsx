"use client"

import { Box, Button, Flex, FormControl, FormErrorMessage, FormHelperText, FormLabel, Heading, SimpleGrid, Text } from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { Form, Formik } from "formik"
import { useRouter } from "next/navigation"
import { useContext } from "react"
import { assertUnreachable, parseEnum } from "shared"
import { CFA, ENTREPRISE, OPCOS_LABEL } from "shared/constants/recruteur"
import { generateUri } from "shared/helpers/generateUri"
import * as Yup from "yup"

import InformationLegaleEntreprise from "@/app/(espace-pro)/espace-pro/(connected)/_components/InformationLegaleEntreprise"
import { infosOpcos } from "@/theme/components/logos/infosOpcos"
import { ApiError } from "@/utils/api.utils"
import { PAGES } from "@/utils/routes.utils"

import { AUTHTYPE } from "../../../../common/contants"
import { phoneValidation } from "../../../../common/validation/fieldValidations"
import { OpcoSelect } from "../../../../components/espace_pro/CreationRecruteur/OpcoSelect"
import { AnimationContainer, CustomInput } from "../../../../components/espace_pro/index"
import { InformationOpco } from "../../../../components/espace_pro/InformationOpco"
import { WidgetContext } from "../../../../context/contextWidget"
import { ArrowRightLine } from "../../../../theme/components/icons"
import { createEtablissement, getEntrepriseOpco } from "../../../../utils/api"

const Formulaire = ({
  onSubmit,
  siret: establishment_siret,
  type,
  origin,
  email,
}: {
  onSubmit: (values: any, { setSubmitting, setFieldError }: any) => void
  siret: string
  type: "CFA" | "ENTREPRISE"
  origin: string
  email?: string
}) => {
  const router = useRouter()
  const { widget } = useContext(WidgetContext)

  const { data: opcoData } = useQuery(["getEntrepriseOpco", establishment_siret], () => getEntrepriseOpco(establishment_siret))

  const opco = parseEnum(OPCOS_LABEL, opcoData?.opco)
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
      onSubmit={onSubmit}
    >
      {({ values, isValid, isSubmitting, setFieldValue, errors }) => {
        const infosOpco = infosOpcos.find((x) => x.nom === values.opco)
        return (
          <Form>
            <FormulaireLayout
              type={type}
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
                  {infosOpco && <InformationOpco isUpdatable={shouldSelectOpco} infosOpco={infosOpco} resetOpcoChoice={() => setFieldValue("opco", "")} />}
                </>
              }
            />
          </Form>
        )
      }}
    </Formik>
  )
}

const FormulaireLayout = ({ left, right, type }: { left: React.ReactNode; right: React.ReactNode; type: string }) => {
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

export const InformationCreationCompte = ({
  isWidget = false,
  establishment_siret,
  email,
  origin,
  type,
}: {
  isWidget?: boolean
  establishment_siret: string
  email?: string
  origin: string
  type: "CFA" | "ENTREPRISE"
}) => {
  const router = useRouter()

  const submitForm = (values: any, { setSubmitting, setFieldError }: any) => {
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
            router.push(
              PAGES.dynamic
                .espaceProCreationOffre({
                  establishment_id: formulaire.establishment_id,
                  type,
                  email: user.email,
                  userId: user._id.toString(),
                  token,
                  displayBanner: !validated,
                  isWidget,
                })
                .getPath()
            )
            break
          }
          case AUTHTYPE.CFA: {
            if (validated) {
              router.push(
                generateUri("/espace-pro/authentification/confirmation", {
                  querystring: { email: user.email },
                })
              )
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
      <Formulaire onSubmit={submitForm} siret={establishment_siret} type={type} origin={origin} email={email} />
    </AnimationContainer>
  )
}
