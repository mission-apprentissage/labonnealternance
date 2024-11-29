import { ExternalLinkIcon } from "@chakra-ui/icons"
import { Alert, AlertIcon, Box, Button, Flex, Heading, Link, SimpleGrid, Text } from "@chakra-ui/react"
import { captureException } from "@sentry/nextjs"
import { Form, Formik } from "formik"
import { useRouter } from "next/router"
import { useContext, useEffect, useState } from "react"
import { BusinessErrorCodes } from "shared/constants/errorCodes"
import { validateSIRET } from "shared/validators/siretValidator"
import * as Yup from "yup"

import { searchEntreprise } from "@/services/searchEntreprises"
import { ApiError } from "@/utils/api.utils"

import { AUTHTYPE } from "../../../common/contants"
import { SIRETValidation } from "../../../common/validation/fieldValidations"
import { LogoContext } from "../../../context/contextLogo"
import { WidgetContext } from "../../../context/contextWidget"
import { getEntrepriseInformation, getEntrepriseOpco, validateCfaCreation } from "../../../utils/api"
import AutocompleteAsync from "../AutocompleteAsync"
import { BandeauProps } from "../Bandeau"
import { Section } from "../common/components/Section"
import { InformationsSiret } from "../CreationRecruteur/InformationsSiret"
import { AnimationContainer, AuthentificationLayout, Bandeau } from "../index"

type EntrepriseOrCfaType = typeof AUTHTYPE.ENTREPRISE | typeof AUTHTYPE.CFA

type Organisation = Awaited<ReturnType<typeof searchEntreprise>>[number]

const CreationCompteForm = ({
  organisationType,
  setBandeau,
  origin,
  isWidget,
  onSelectOrganisation,
}: {
  organisationType: EntrepriseOrCfaType
  isWidget: boolean
  origin: string
  setBandeau: (props: BandeauProps) => void
  onSelectOrganisation: (organisation: Organisation | null) => void
}) => {
  const router = useRouter()
  const [isCfa, setIsCfa] = useState(false)
  const [selectedEntreprise, setSelectedEntreprise] = useState<Organisation | null>(null)
  const [searchInput, setSearchInput] = useState<string>()

  const nextUri = isWidget ? "/espace-pro/widget/entreprise/detail" : "/espace-pro/creation/detail"

  const submitSiret = ({ establishment_siret }, { setSubmitting, setFieldError }) => {
    setBandeau(null)
    const formattedSiret = establishment_siret.replace(/[^0-9]/g, "")
    // validate establishment_siret
    if (organisationType === AUTHTYPE.ENTREPRISE) {
      Promise.all([getEntrepriseOpco(formattedSiret), getEntrepriseInformation(formattedSiret)]).then(([opcoInfos, entrepriseData]) => {
        if (entrepriseData.error === true) {
          if (entrepriseData.statusCode >= 500) {
            router.push({
              pathname: nextUri,
              query: { type: organisationType, origin, informationSiret: JSON.stringify({ establishment_siret: formattedSiret, ...opcoInfos }) },
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
            query: { informationSiret: JSON.stringify({ establishment_siret: formattedSiret, ...opcoInfos }), type: organisationType, origin },
          })
        }
      })
    } else {
      validateCfaCreation(formattedSiret)
        .then(() => {
          setSubmitting(false)
          router.push({
            pathname: nextUri,
            query: { informationSiret: JSON.stringify({ establishment_siret: formattedSiret }), type: organisationType, origin },
          })
        })
        .catch((error) => {
          if (error instanceof ApiError) {
            const { statusCode, errorData } = error.context
            if (statusCode >= 400 && statusCode < 500) {
              const { reason } = errorData
              if (reason === BusinessErrorCodes.ALREADY_EXISTS) {
                setFieldError("establishment_siret", "Ce numéro siret est déjà associé à un compte utilisateur.")
              } else if (reason === BusinessErrorCodes.NOT_QUALIOPI) {
                setFieldError("establishment_siret", "L’organisme rattaché à ce SIRET n’est pas certifié Qualiopi")
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
      {({ values, errors, isValid, isSubmitting, setFieldValue, submitForm, setFieldTouched }) => {
        return (
          <Form>
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
            <AutocompleteAsync
              name="establishment_siret"
              handleSearch={(search: string) => searchEntreprise(search)}
              renderItem={({ raison_sociale, siret, adresse }, highlighted) => <EntrepriseCard {...{ raison_sociale, siret, adresse, highlighted }} />}
              itemToString={({ siret }) => siret}
              onInputFieldChange={(value, hasError) => {
                setSearchInput(value)
                if (!hasError) return
                setFieldTouched("establishment_siret", true, false)
                setFieldValue("establishment_siret", value, true)
              }}
              onSelectItem={(organisation) => {
                setSelectedEntreprise(organisation)
                setFieldTouched("establishment_siret", false, false)
                setFieldValue("establishment_siret", organisation?.siret, true)
                onSelectOrganisation(organisation)
              }}
              onError={(error, inputValue) => {
                captureException(error)
                setFieldTouched("establishment_siret", true, false)
                setFieldValue("establishment_siret", inputValue, true)
              }}
              allowHealFromError={false}
              renderNoResult={
                /^[0-9]{14}$/.test(searchInput) && !validateSIRET(searchInput) ? (
                  <Box>
                    <Text fontSize="12px" lineHeight="20px" color="#CE0500" padding="8px 16px">
                      Le numéro de SIRET saisi n’est pas valide
                    </Text>
                  </Box>
                ) : undefined
              }
              renderError={() =>
                values?.establishment_siret && !errors?.establishment_siret ? null : (
                  <Box>
                    <Text fontSize="12px" lineHeight="20px" color="#CE0500" padding="8px 16px">
                      La recherche par raison sociale est temporairement indisponible.
                      <br />
                      <b>Veuillez renseigner votre numéro de SIRET.</b>
                    </Text>
                  </Box>
                )
              }
            />
            {selectedEntreprise && (
              <Box marginTop="32px">
                <Text fontSize="16px" lineHeight="24px">
                  Établissement sélectionné :
                </Text>
                <Box border="solid 1px #000091" marginTop="8px">
                  <EntrepriseCard {...selectedEntreprise} />
                </Box>
              </Box>
            )}

            <Flex justify="flex-start" marginTop="32px">
              <Button type="submit" variant="form" isActive={isValid} isDisabled={!isValid || isSubmitting} isLoading={isSubmitting}>
                Continuer
              </Button>
            </Flex>
          </Form>
        )
      }}
    </Formik>
  )
}

export default function CreationCompte({ type, isWidget = false, origin = "lba" }: { type: EntrepriseOrCfaType; isWidget?: boolean; origin?: string }) {
  const [organisationType, setOrganisationType] = useState<EntrepriseOrCfaType>(type)
  const { setWidget, widget: wid } = useContext(WidgetContext)
  const { setOrganisation } = useContext(LogoContext)
  const [bandeau, setBandeau] = useState<BandeauProps>(null)
  const [selectedTab, setSelectedTab] = useState<EntrepriseOrCfaType>(type)
  const router = useRouter()
  const mobile = router.query.mobile === "true" ? true : false

  useEffect(() => {
    if (isWidget) {
      setWidget({ isWidget: true, mobile: mobile ?? false })
      setOrganisation(origin ?? "lba")
    }
    /* eslint react-hooks/exhaustive-deps: 0 */
  }, [])

  const onSelectOrganisation = (organisation: Organisation | null) => {
    if (organisation?.activite_principale?.startsWith("85")) {
      setOrganisationType(AUTHTYPE.CFA)
      setSelectedTab(AUTHTYPE.CFA)
    } else {
      setOrganisationType(AUTHTYPE.ENTREPRISE)
      setSelectedTab(AUTHTYPE.ENTREPRISE)
    }
  }

  return (
    <AuthentificationLayout>
      <AnimationContainer>
        {bandeau && <Bandeau {...bandeau} />}
        <SimpleGrid columns={[1, 1, 1, 2]} spacing={[0, 0, 0, "75px"]} mt={wid.isWidget ? 0 : { base: 4, md: 12 }}>
          <Box>
            {wid.isWidget && (
              <Text textTransform="uppercase" fontSize="20px" color="#666666">
                Dépot simplifié d'offre en alternance
              </Text>
            )}
            <Heading>Identifiez votre entreprise</Heading>
            <Text fontSize="20px" textAlign="justify" mt={2} mb={4}>
              Vous recrutez des alternants ? Précisez la raison sociale ou le numéro de SIRET de votre établissement.
            </Text>
            <CreationCompteForm organisationType={organisationType} setBandeau={setBandeau} origin={origin} isWidget={isWidget} onSelectOrganisation={onSelectOrganisation} />
          </Box>
          <Box mt={[4, 4, 4, 0]}>
            <Section>
              <InformationsSiret currentTab={selectedTab} onCurrentTabChange={setSelectedTab} />
            </Section>
          </Box>
        </SimpleGrid>
      </AnimationContainer>
    </AuthentificationLayout>
  )
}

const EntrepriseCard = ({ adresse, raison_sociale, siret, highlighted }: { highlighted?: boolean; raison_sociale: string; siret: string; adresse: string }) => {
  return (
    <Box backgroundColor={highlighted ? "#F6F6F6" : "white"} padding="8px 16px">
      <Text color="#161616" fontSize="16px" lineHeight="24px" fontWeight={700}>
        {raison_sociale}
      </Text>
      <Text color="#161616" fontSize="16px" lineHeight="24px">
        {siret}
      </Text>
      <Text color="#666666" fontSize="12px" lineHeight="20px">
        {adresse}
      </Text>
    </Box>
  )
}
