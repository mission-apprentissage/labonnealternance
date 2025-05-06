import { WarningIcon, CheckCircleIcon, InfoIcon, CloseIcon } from "@chakra-ui/icons"
import { Box, Button, Flex, Link, Text } from "@chakra-ui/react"
import React, { useContext } from "react"

import { publicConfig } from "@/config.public"
import { DisplayContext } from "@/context/DisplayContextProvider"

const blueBannerText = (
  <Text>
    <Text as="span" fontWeight={700}>
      Souhaiteriez-vous accéder à toutes vos candidatures depuis votre espace connecté ?{" "}
    </Text>
    <Link textDecoration="underline" href="https://tally.so/r/3Xq19z" isExternal aria-label="Accéder au formulaire - nouvelle fenêtre">
      Donnez-nous votre avis en 3 clics.
    </Link>
  </Text>
)

const greenBannerText = (
  <Text>
    <Text as="span" fontWeight={700}>
      Problème résolu.
    </Text>{" "}
    Le service est à nouveau fonctionnel, merci d’avoir patienté.
  </Text>
)

const redBannerText = (
  <Text>
    <Text as="span" fontWeight={700}>
      Service temporairement dégradé.
    </Text>{" "}
    Suite à un problème chez notre prestataire d'envoi d'emails, les envois de candidatures sont momentanément interrompus. Nous vous prions de nous excuser pour la gêne
    occasionnée et vous invitons à revenir ultérieurement. {/*<Link textDecoration="underline">En savoir plus</Link>*/}
  </Text>
)

const envBannerText = (
  <Text>
    <Text as="span" fontWeight={700}>
      Vous êtes ici sur un site de test !
    </Text>{" "}
    Vos candidatures ne seront pas transmises aux recruteurs ni aux centres de formation. Pour accéder au site La bonne alternance, veuillez cliquer sur ce lien :{" "}
    <Link href="https://labonnealternance.apprentissage.beta.gouv.fr" textDecoration="underline">
      La bonne alternance - Trouvez votre alternance
    </Link>
  </Text>
)

const getCloseButton = (setBannerContext: any, isClosedStateName: string, color: string) => {
  return (
    <Button
      fontWeight={700}
      background="none"
      alignItems="baseline"
      height="1.5rem"
      sx={{
        _hover: {
          background: "none",
          textDecoration: "none",
        },
        _active: {
          background: "none",
        },
      }}
      onClick={() => setBannerContext(isClosedStateName, true)}
    >
      <CloseIcon color={color} w={2} h={2} mt={2} ml={2} />
    </Button>
  )
}

const InfoBanner = ({
  showInfo = false,
  showAlert = false,
  showOK = false,
  forceEnvBanner = false,
  showEnvAlert = true,
}: {
  showInfo?: boolean
  showAlert?: boolean
  showOK?: boolean
  forceEnvBanner?: boolean
  showEnvAlert?: boolean
}) => {
  const { bannerStates, setBannerStates } = useContext(DisplayContext)
  const { isEnvClosed, isAlertClosed, isOKClosed, isInfoClosed } = bannerStates

  const setBannerContext = (banner: string, isClosed: boolean) => {
    const newBannerStates = { ...bannerStates }
    newBannerStates[banner] = isClosed
    setBannerStates(newBannerStates)
  }

  const { env } = publicConfig

  return (
    <>
      {showEnvAlert && env !== "production" && (forceEnvBanner || !isEnvClosed) && (
        <Box backgroundColor="#FFE9E6" p={2} mb={1}>
          <Flex alignItems="center-start" maxWidth="1310px" margin="auto" color="#B34000">
            <WarningIcon mr={4} mt={1} />
            <Box flexGrow={1}>{envBannerText}</Box>
            {!forceEnvBanner && getCloseButton(setBannerContext, "isEnvClosed", "#B34000")}
          </Flex>
        </Box>
      )}
      {!isAlertClosed && showAlert && (
        <Box backgroundColor="#FFE9E6" p={2} mb={1}>
          <Flex alignItems="center-start" maxWidth="1310px" margin="auto" color="#B34000">
            <WarningIcon mr={4} mt={1} />
            <Box flexGrow={1}>{redBannerText}</Box>
            {getCloseButton(setBannerContext, "isAlertClosed", "#B34000")}
          </Flex>
        </Box>
      )}
      {!isOKClosed && showOK && (
        <Box backgroundColor="#B8FEC9" p={2} mb={1}>
          <Flex alignItems="center-start" maxWidth="1310px" margin="auto" color="#18753C">
            <CheckCircleIcon mr={4} mt={1} />
            <Box flexGrow={1}>{greenBannerText}</Box>
            {getCloseButton(setBannerContext, "isOKClosed", "#18753C")}
          </Flex>
        </Box>
      )}
      {!isInfoClosed && showInfo && (
        <Box backgroundColor="#E8EDFF" p={2} mb={1}>
          <Flex alignItems="center-start" maxWidth="1310px" margin="auto" color="#0063CB">
            <InfoIcon mr={4} mt={1} />
            <Box flexGrow={1}>{blueBannerText}</Box>
            {getCloseButton(setBannerContext, "isInfoClosed", "#0063CB")}
          </Flex>
        </Box>
      )}
    </>
  )
}

export default InfoBanner
