import { ExternalLinkIcon } from "@chakra-ui/icons"
import { Alert, AlertIcon, Box, Button, Flex, Heading, Link, SimpleGrid, Text } from "@chakra-ui/react"
import { Form, Formik } from "formik"
import { useRouter } from "next/router"
import { useContext, useEffect, useState } from "react"
import { BusinessErrorCodes } from "shared/constants/errorCodes"
import * as Yup from "yup"

import { ApiError } from "@/utils/api.utils"

import { AUTHTYPE } from "../../../common/contants"
import { SIRETValidation } from "../../../common/validation/fieldValidations"
import { LogoContext } from "../../../context/contextLogo"
import { WidgetContext } from "../../../context/contextWidget"
import { SearchLine } from "../../../theme/components/icons"
import { getCfaInformation, getEntrepriseInformation, getEntrepriseOpco } from "../../../utils/api"
import { BandeauProps } from "../Bandeau"
import { Section } from "../common/components/Section"
import { InformationsSiret } from "../CreationRecruteur/InformationsSiret"
import { AnimationContainer, AuthentificationLayout, Bandeau, CustomInput, InformationLegaleEntreprise } from "../index"
import { InformationLegaleEntrepriseProps } from "../InformationLegaleEntreprise"

type EntrepriseOrCfaType = typeof AUTHTYPE.ENTREPRISE | typeof AUTHTYPE.CFA

const CreationCompteForm = ({
  type,
  setQualiopi,
  setBandeau,
  origin,
  isWidget,
}: {
  type: EntrepriseOrCfaType
  isWidget: boolean
  origin: string
  setQualiopi: (props: InformationLegaleEntrepriseProps) => void
  setBandeau: (props: BandeauProps) => void
}) => {
  const router = useRouter()
  const [isCfa, setIsCfa] = useState(false)

  const nextUri = isWidget ? "/espace-pro/widget/entreprise/detail" : "/espace-pro/creation/detail"

  const submitSiret = ({ establishment_siret }, { setSubmitting, setFieldError }) => {
    setBandeau(null)
    const formattedSiret = establishment_siret.replace(/[^0-9]/g, "")
    // validate establishment_siret
    if (type === AUTHTYPE.ENTREPRISE) {
      Promise.all([getEntrepriseOpco(formattedSiret), getEntrepriseInformation(formattedSiret)]).then(([opcoInfos, entrepriseData]) => {
        if (entrepriseData.error === true) {
          if (entrepriseData.statusCode >= 500) {
            router.push({
              pathname: nextUri,
              query: { type, origin, informationSiret: JSON.stringify({ establishment_siret: formattedSiret, ...opcoInfos }) },
            })
          } else {
            setFieldError("establishment_siret", entrepriseData?.data?.errorCode === BusinessErrorCodes.NON_DIFFUSIBLE ? BusinessErrorCodes.NON_DIFFUSIBLE : entrepriseData.message)
            setIsCfa(entrepriseData?.data?.errorCode === BusinessErrorCodes.IS_CFA)
            setSubmitting(false)
          }
        } else if (entrepriseData.error === false) {
          setSubmitting(true)
          router.push({
            pathname: nextUri,
            query: { informationSiret: JSON.stringify({ ...entrepriseData.data, ...opcoInfos }), type, origin },
          })
        }
      })
    } else {
      getCfaInformation(formattedSiret)
        .then((data) => {
          setSubmitting(false)
          router.push({
            pathname: nextUri,
            query: { informationSiret: JSON.stringify(data), type, origin },
          })
        })
        .catch((error) => {
          if (error instanceof ApiError) {
            const { statusCode, errorData } = error.context
            if (statusCode >= 400 && statusCode < 500) {
              const { reason, data } = errorData
              if (reason === BusinessErrorCodes.ALREADY_EXISTS) {
                setFieldError("establishment_siret", "Ce numéro siret est déjà associé à un compte utilisateur.")
              } else if (reason === BusinessErrorCodes.NOT_QUALIOPI) {
                setFieldError("establishment_siret", "L’organisme rattaché à ce SIRET n’est pas certifié Qualiopi")
                setQualiopi(data)
                setBandeau({
                  type: "error",
                  header: "Votre centre de formation n’est pas certifié Qualiopi.",
                  description: "Pour obtenir la certification, faites la démarche auprès d’un organisme certificateur : ",
                  lien: "https://travail-emploi.gouv.fr/formation-professionnelle/acteurs-cadre-et-qualite-de-la-formation-professionnelle/liste-organismes-certificateurs",
                })
              } else if (reason === BusinessErrorCodes.CLOSED) {
                setFieldError("establishment_siret", "Le numéro siret indique un établissement fermé.")
                setBandeau({
                  type: "error",
                  header: "Votre centre de formation est renseigné comme fermé.",
                  description: "Pour modifier les caractéristiques de votre organisme, vous pouvez vous rapprocher de l’INSEE afin de réaliser les modifications à la source.",
                })
              } else if (reason === BusinessErrorCodes.UNKNOWN) {
                setFieldError("establishment_siret", "Le numéro siret n'est pas référencé comme centre de formation.")
                setBandeau({
                  type: "error",
                  header: "Votre centre de formation n’est pas référencé dans notre catalogue.",
                  description: "Pour ajouter une offre de formation au catalogue, renseignez-vous auprès du Carif-Oref de votre région : ",
                  lien: "https://reseau.intercariforef.org/referencer-son-offre-de-formation",
                })
              } else if (reason === BusinessErrorCodes.UNSUPPORTED) {
                setFieldError("establishment_siret", "Pour des raisons techniques, les organismes de formation à distance ne sont pas acceptés actuellement.")
                setBandeau({
                  type: "error",
                  header: "Pour des raisons techniques, les organismes de formation à distance ne sont pas acceptés actuellement.",
                  description: (
                    <>
                      <Link
                        aria-label="Contact de l'équipe La bonne alternance par email - nouvelle fenêtre"
                        isExternal
                        textDecoration="underline"
                        href={`mailto:labonnealternance@apprentissage.beta.gouv.fr?subject=${encodeURIComponent("Inscription d'un organisme de formation à distance")}`}
                      >
                        Contactez-nous <ExternalLinkIcon mx="2px" />
                      </Link>{" "}
                      pour obtenir plus d'informations.
                    </>
                  ),
                })
              }
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
                      router.push("/espace-pro/creation/cfa")
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
        )
      }}
    </Formik>
  )
}

export default function CreationCompte({ type, isWidget = false, origin = "lba" }: { type: EntrepriseOrCfaType; isWidget?: boolean; origin?: string }) {
  const { setWidget, widget: wid } = useContext(WidgetContext)
  const { setOrganisation } = useContext(LogoContext)
  const [qualiopi, setQualiopi] = useState<InformationLegaleEntrepriseProps>(null)
  const [bandeau, setBandeau] = useState<BandeauProps>(null)
  const router = useRouter()
  const mobile = router.query.mobile === "true" ? true : false

  useEffect(() => {
    if (isWidget) {
      setWidget({ isWidget: true, mobile: mobile ?? false })
      setOrganisation(origin ?? "matcha")
    }
    /* eslint react-hooks/exhaustive-deps: 0 */
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
            <CreationCompteForm type={type} setQualiopi={setQualiopi} setBandeau={setBandeau} origin={origin} isWidget={isWidget} />
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
