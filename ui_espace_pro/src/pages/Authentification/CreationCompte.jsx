import { Alert, AlertIcon, Box, Button, Flex, Heading, Link, SimpleGrid, Text } from "@chakra-ui/react"
import { Form, Formik } from "formik"
import { useContext, useEffect, useState } from "react"
import { useNavigate, useParams, useSearchParams } from "react-router-dom"
import * as Yup from "yup"
import { getCfaInformation, getEntrepriseInformation, getEntrepriseOpco } from "../../api"
import { Section } from "../../common/components/Section"
import { AUTHTYPE } from "../../common/contants"
import { SIRETValidation } from "../../common/validation/fieldValidations"
import { AnimationContainer, AuthentificationLayout, Bandeau, CustomInput, InformationLegaleEntreprise } from "../../components"
import { InformationsSiret } from "../../components/CreationRecruteur/InformationsSiret"
import { LogoContext } from "../../contextLogo"
import { WidgetContext } from "../../contextWidget"
import { SearchLine } from "../../theme/components/icons"

const CreationCompteForm = ({ type, setQualiopi, setBandeau }) => {
  const [isCfa, setIsCfa] = useState(false)
  const navigate = useNavigate()
  const { origin } = useParams()

  const submitSiret = ({ establishment_siret }, { setSubmitting, setFieldError }) => {
    setBandeau(false)
    const formattedSiret = establishment_siret.replace(/[^0-9]/g, "")

    // validate establishment_siret
    if (type === AUTHTYPE.ENTREPRISE) {
      Promise.all([getEntrepriseOpco(formattedSiret), getEntrepriseInformation(formattedSiret)]).then(([opcoInfos, entrepriseData]) => {
        if (entrepriseData.error) {
          if (entrepriseData.errorType === "server") {
            navigate("/creation/detail", { state: { type, origin, informationSiret: { establishment_siret: formattedSiret, ...opcoInfos } } })
          } else {
            setFieldError("establishment_siret", entrepriseData.message)
            setIsCfa(entrepriseData?.isCfa)
            setSubmitting(false)
          }
        } else {
          setSubmitting(true)
          navigate("/creation/detail", { state: { informationSiret: { ...entrepriseData, ...opcoInfos }, type, origin } })
        }
      })
    } else {
      getCfaInformation(formattedSiret)
        .then(({ data }) => {
          setSubmitting(false)
          navigate("/creation/detail", { state: { informationSiret: data, type, origin } })
        })
        .catch(({ response }) => {
          if (response.data.error) {
            if (response.data.reason === "EXIST") {
              setFieldError("establishment_siret", "Ce numéro siret est déjà associé à un compte utilisateur.")
            }
            if (response.data.reason === "QUALIOPI") {
              setFieldError("establishment_siret", "L’organisme rattaché à ce SIRET n’est pas certifié Qualiopi")
              setQualiopi(response.data.data)
              setBandeau({
                type: "error",
                header: "Votre centre de formation n’est pas certifié Qualiopi.",
                description: "Pour obtenir la certification, faites la démarche auprès d’un organisme certificateur : ",
                lien: "https://travail-emploi.gouv.fr/formation-professionnelle/acteurs-cadre-et-qualite-de-la-formation-professionnelle/liste-organismes-certificateurs",
              })
            }
            if (response.data.reason === "CLOSED") {
              setFieldError("establishment_siret", "Le numéro siret indique un établissement fermé.")
              setBandeau({
                type: "error",
                header: "Votre centre de formation est renseigné comme fermé.",
                description: "Pour modifier les caractéristiques de votre organisme, vous pouvez vous rapprocher de l’INSEE afin de réaliser les modifications à la source.",
              })
            }
            if (response.data.reason === "UNKNOWN") {
              setFieldError("establishment_siret", "Le numéro siret n'est pas référencé comme centre de formation.")
              setBandeau({
                type: "error",
                header: "Votre centre de formation n’est pas référencé dans notre catalogue.",
                description: "Pour ajouter une offre de formation au catalogue, renseignez-vous auprès du Carif-Oref de votre région : ",
                lien: "https://reseau.intercariforef.org/referencer-son-offre-de-formation",
              })
            }
          }

          setSubmitting(false)
        })
    }
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
                    <Link
                      variant="classic"
                      onClick={() => {
                        setIsCfa(false)
                        setFieldValue("establishment_siret", values.establishment_siret)
                        navigate("/creation/cfa")
                        submitForm()
                      }}
                    >
                      veuillez utiliser ce lien
                    </Link>
                  </Text>
                </Alert>
              )}
              <Flex justify="flex-end" mt={5}>
                <Button type="submit" variant="form" leftIcon={<SearchLine width={5} />} isActive={isValid} isDisabled={!isValid || isSubmitting} isLoading={isSubmitting}>
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

export const CreationCompte = ({ type, widget }) => {
  const { setWidget, widget: wid } = useContext(WidgetContext)
  const { setOrganisation } = useContext(LogoContext)
  const [qualiopi, setQualiopi] = useState()
  const [bandeau, setBandeau] = useState()
  const params = useParams()
  const [searchParams] = useSearchParams()

  let mobile = searchParams.get("mobile") === "true" ? true : false

  useEffect(() => {
    if (widget) {
      setWidget((prev) => ({ ...prev, isWidget: true, mobile: mobile ?? false }))
      setOrganisation(params.origin ?? "matcha")
    }
  }, [])

  return (
    <AuthentificationLayout>
      <AnimationContainer>
        {bandeau && <Bandeau {...bandeau} />}
        <SimpleGrid columns={[1, 1, 1, 2]} spacing={[0, 0, 0, "75px"]} mt={wid.isWidget ? 0 : 12}>
          <Box>
            {wid.isWidget && (
              <Text textTransform="uppercase" fontSize="20px" color="#666666">
                Dépot simplifié d'offre en alternance
              </Text>
            )}
            <Heading>{type === AUTHTYPE.ENTREPRISE ? "Retrouvez votre entreprise" : "Créez votre compte"}</Heading>
            <Text fontSize="20px" textAlign="justify" mt={2} mb={4}>
              Nous avons besoin du numéro SIRET de votre {type === AUTHTYPE.ENTREPRISE ? "entreprise" : "organisme de formation"} afin de vous identifier.
            </Text>
            <CreationCompteForm type={type} setQualiopi={setQualiopi} setBandeau={setBandeau} />
          </Box>
          <Box mt={[4, 4, 4, 0]}>
            {qualiopi ? (
              <InformationLegaleEntreprise {...qualiopi} />
            ) : (
              <Section>
                <InformationsSiret type={type} />
              </Section>
            )}
          </Box>
        </SimpleGrid>
      </AnimationContainer>
    </AuthentificationLayout>
  )
}

export default CreationCompte
