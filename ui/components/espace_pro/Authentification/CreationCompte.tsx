import { ExternalLinkIcon } from "@chakra-ui/icons"
import { Alert, AlertIcon, Box, Heading, Link, SimpleGrid, Text } from "@chakra-ui/react"
import { useRouter } from "next/router"
import { useContext, useEffect, useState } from "react"
import { BusinessErrorCodes } from "shared/constants/errorCodes"

import { BorderedBox } from "@/components/espace_pro/common/components/BorderedBox"
import { searchEntreprise } from "@/services/searchEntreprises"
import { ApiError } from "@/utils/api.utils"

import { AUTHTYPE } from "../../../common/contants"
import { LogoContext } from "../../../context/contextLogo"
import { WidgetContext } from "../../../context/contextWidget"
import { getEntrepriseInformation, getEntrepriseOpco, validateCfaCreation } from "../../../utils/api"
import { Bandeau, BandeauProps } from "../Bandeau"
import { InformationsSiret } from "../CreationRecruteur/InformationsSiret"
import { AnimationContainer, AuthentificationLayout } from "../index"

import { SiretAutocomplete } from "./SiretAutocomplete"

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
                setBandeau({
                  type: "error",
                  header: "Ce numéro siret est déjà associé à un compte utilisateur.",
                  description: "",
                })
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
    <>
      {isCfa && (
        <Alert status="info" variant="top-accent">
          <AlertIcon />
          <Text>
            Pour les organismes de formation,{" "}
            <Link
              variant="classic"
              onClick={() => {
                setIsCfa(false)
                router.push("/espace-pro/creation/cfa")
              }}
            >
              veuillez utiliser ce lien
            </Link>
          </Text>
        </Alert>
      )}
      <SiretAutocomplete onSubmit={submitSiret} onSelectOrganisation={onSelectOrganisation} />
    </>
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
        <SimpleGrid columns={[1, 1, 2, 2]} spacing={[0, 0, 4, 4]} mt={wid.isWidget ? 0 : { base: 4, md: 12 }}>
          <Box mb={4}>
            {wid.isWidget && (
              <Text textTransform="uppercase" fontSize="20px" color="#666666">
                Dépot simplifié d'offre en alternance
              </Text>
            )}
            <Heading className="big">Vous recrutez des alternants ?</Heading>
            <Text className="big" mt={2} mb={4}>
              Précisez le nom ou le numéro de SIRET de votre établissement.
            </Text>
            <CreationCompteForm organisationType={organisationType} setBandeau={setBandeau} origin={origin} isWidget={isWidget} onSelectOrganisation={onSelectOrganisation} />
          </Box>
          <BorderedBox>
            <InformationsSiret currentTab={selectedTab} onCurrentTabChange={setSelectedTab} />
          </BorderedBox>
        </SimpleGrid>
      </AnimationContainer>
    </AuthentificationLayout>
  )
}
