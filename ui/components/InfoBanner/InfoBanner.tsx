import { WarningIcon, CheckCircleIcon, InfoIcon } from "@chakra-ui/icons"
import Button from "@codegouvfr/react-dsfr/Button"
import { Box, Link, Typography } from "@mui/material"
import React, { useContext } from "react"

import { publicConfig } from "@/config.public"
import { DisplayContext } from "@/context/DisplayContextProvider"

const blueBannerText = (
  <Typography>
    <Typography sx={{ display: "inline", fontWeight: 700 }}>Souhaiteriez-vous accéder à toutes vos candidatures depuis votre espace connecté ? </Typography>
    <Link underline="always" href="https://tally.so/r/3Xq19z" color="inherit" aria-label="Accéder au formulaire - nouvelle fenêtre" target="_blank" rel="noopener noreferrer">
      Donnez-nous votre avis en 3 clics.
    </Link>
  </Typography>
)

const greenBannerText = (
  <Typography>
    <Typography sx={{ display: "inline", fontWeight: 700 }}>Problème résolu.</Typography> Le service est à nouveau fonctionnel, merci d’avoir patienté.
  </Typography>
)

const redBannerText = (
  <Typography>
    <Typography sx={{ display: "inline", fontWeight: 700 }}>Service temporairement dégradé.</Typography> Suite à un problème chez notre prestataire d'envoi d'emails, les envois de
    candidatures sont momentanément interrompus. Nous vous prions de nous excuser pour la gêne occasionnée et vous invitons à revenir ultérieurement.{" "}
    {/*<Link textDecoration="underline">En savoir plus</Link>*/}
  </Typography>
)

const envBannerText = (
  <Typography>
    <Typography sx={{ display: "inline", fontWeight: 700 }}>Vous êtes ici sur un site de test !</Typography> Vos candidatures ne seront pas transmises aux recruteurs ni aux centres
    de formation. Pour accéder au site La bonne alternance, veuillez cliquer sur ce lien :{" "}
    <Link href="https://labonnealternance.apprentissage.beta.gouv.fr" color="inherit" underline="always" target="_blank" rel="noopener noreferrer">
      La bonne alternance - Trouvez votre alternance
    </Link>
  </Typography>
)

const getCloseButton = (setBannerContext: any, isClosedStateName: string, color: string) => {
  return (
    <Button
      style={{ color }}
      type="button"
      priority="tertiary no outline"
      iconId="fr-icon-close-line"
      iconPosition="right"
      onClick={() => setBannerContext(isClosedStateName, true)}
    >
      {" "}
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
        <Box sx={{ backgroundColor: "#FFE9E6" }} p={2} mb={1}>
          <Box style={{ display: "flex", alignItems: "center-start", maxWidth: "1310px", margin: "auto", color: "#B34000" }}>
            <WarningIcon mr={4} mt={1} />
            <Box flexGrow={1}>{envBannerText}</Box>
            {!forceEnvBanner && getCloseButton(setBannerContext, "isEnvClosed", "#B34000")}
          </Box>
        </Box>
      )}
      {!isAlertClosed && showAlert && (
        <Box sx={{ backgroundColor: "#FFE9E6" }} p={2} mb={1}>
          <Box style={{ display: "flex", alignItems: "center-start", maxWidth: "1310px", margin: "auto", color: "#B34000" }}>
            <WarningIcon mr={4} mt={1} />
            <Box flexGrow={1}>{redBannerText}</Box>
            {getCloseButton(setBannerContext, "isAlertClosed", "#B34000")}
          </Box>
        </Box>
      )}
      {!isOKClosed && showOK && (
        <Box sx={{ backgroundColor: "#B8FEC9" }} p={2} mb={1}>
          <Box style={{ display: "flex", alignItems: "center-start", maxWidth: "1310px", margin: "auto", color: "#18753C" }}>
            <CheckCircleIcon mr={4} mt={1} />
            <Box flexGrow={1}>{greenBannerText}</Box>
            {getCloseButton(setBannerContext, "isOKClosed", "#18753C")}
          </Box>
        </Box>
      )}
      {!isInfoClosed && showInfo && (
        <Box sx={{ backgroundColor: "#E8EDFF" }} p={2} mb={1}>
          <Box style={{ display: "flex", alignItems: "center-start", maxWidth: "1310px", margin: "auto", color: "#0063CB" }}>
            <InfoIcon mr={4} mt={1} />
            <Box flexGrow={1}>{blueBannerText}</Box>
            {getCloseButton(setBannerContext, "isInfoClosed", "#0063CB")}
          </Box>
        </Box>
      )}
    </>
  )
}

export default InfoBanner
