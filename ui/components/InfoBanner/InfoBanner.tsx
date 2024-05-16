import { WarningIcon, CheckCircleIcon, InfoIcon, CloseIcon } from "@chakra-ui/icons"
import { Box, Button, Flex, Link, Text } from "@chakra-ui/react"
import React, { useState } from "react"

import { publicConfig } from "@/config.public"

const blueBannerText = (
  <Text>
    <Text as="span" fontWeight={700}>
      La bonne alternance évolue !
    </Text>{" "}
    Vous pouvez désormais être plusieurs utilisateurs au sein de votre organisation à gérer les offres d’emploi de votre entreprise.{" "}
    <Link textDecoration="underline">En savoir plus</Link>
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
      Service temporairement indisponible.
    </Text>{" "}
    Suite à un problème chez l’un de nos fournisseurs de données, la création de compte est momentanément bloquée. Merci de revenir ultérieurement.{" "}
    <Link textDecoration="underline">En savoir plus</Link>
  </Text>
)

const envBannerText = (
  <Text>
    <Text as="span" fontWeight={700}>
      Vous êtes ici sur un site de test !
    </Text>{" "}
    Vos candidatures ne seront pas transmises aux recruteurs ni aux centres de formation . Pour accéder au site La bonne alternance, veuillez utiliser cette URL :{" "}
    <Link href="https://labonnealternance.apprentissage.beta.gouv.fr" textDecoration="underline">
      La bonne alternance - Trouvez votre alternance
    </Link>
  </Text>
)

const getCloseButton = (setIsClosedState, color: string) => {
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
      onClick={() => setIsClosedState(true)}
    >
      <CloseIcon color={color} w={2} h={2} mt={2} ml={2} />
    </Button>
  )
}

const InfoBanner = ({
  temp,
  color,
  showInfo = true,
  showAlert = true,
  showOK = true,
}: {
  temp: string
  color: string
  showInfo?: boolean
  showAlert?: boolean
  showOK?: boolean
}) => {
  const [isEnvClosed, setIsEnvClosed] = useState(false)
  const [isAlertClosed, setIsAlertClosed] = useState(false)
  const [isInfoClosed, setIsInfoClosed] = useState(false)
  const [isOKClosed, setIsOKClosed] = useState(false)

  const { env } = publicConfig

  return (
    <>
      {!isEnvClosed && env !== "production" && (
        <Box backgroundColor={color} p={2}>
          <Flex alignItems="center-start" maxWidth="1310px" margin="auto" color="#B34000">
            <WarningIcon mr={4} mt={1} />
            <Box>{temp}</Box>
            <Box flexGrow={1}>{envBannerText}</Box>
            {getCloseButton(setIsEnvClosed, "#B34000")}
          </Flex>
        </Box>
      )}
      {!isAlertClosed && showAlert && (
        <Box backgroundColor="#FFE9E6" p={2}>
          <Flex alignItems="center-start" maxWidth="1310px" margin="auto" color="#B34000">
            <WarningIcon mr={4} mt={1} />
            <Box flexGrow={1}>{redBannerText}</Box>
            {getCloseButton(setIsAlertClosed, "#B34000")}
          </Flex>
        </Box>
      )}
      {!isOKClosed && showOK && (
        <Box backgroundColor="#B8FEC9" p={2}>
          <Flex alignItems="center-start" maxWidth="1310px" margin="auto" color="#18753C">
            <CheckCircleIcon mr={4} mt={1} />
            <Box flexGrow={1}>{greenBannerText}</Box>
            {getCloseButton(setIsOKClosed, "#18753C")}
          </Flex>
        </Box>
      )}
      {!isInfoClosed && showInfo && (
        <Box backgroundColor="#E8EDFF" p={2}>
          <Flex alignItems="center-start" maxWidth="1310px" margin="auto" color="#0063CB">
            <InfoIcon mr={4} mt={1} />
            <Box flexGrow={1}>{blueBannerText}</Box>
            {getCloseButton(setIsInfoClosed, "#0063CB")}
          </Flex>
        </Box>
      )}
    </>
  )
}

export default InfoBanner
