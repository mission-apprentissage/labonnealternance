import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import { Box, Grid, Typography } from "@mui/material"
import Image from "next/image"
import { AUTHTYPE } from "shared/constants/recruteur"
import { getSession } from "@/utils/getSession"
import { PAGES } from "@/utils/routes.utils"

type IUserType = "CFA_CONNECTED" | "CFA" | "RECRUTEUR_CONNECTED" | "RECRUTEUR" | "OTHER"

const getUserType = ({ source, user }: { source?: string; user?: { type?: AUTHTYPE } }) => {
  if (user) {
    if (user.type === AUTHTYPE.CFA) return "CFA_CONNECTED"
    if (user.type === AUTHTYPE.ENTREPRISE) return "RECRUTEUR_CONNECTED"
  } else {
    if (source === "guide-cfa") return "CFA"
    if (source === "guide-recruteur") return "RECRUTEUR"
  }

  return "OTHER"
}

const getTitle = (userType: IUserType) => {
  switch (userType) {
    case "CFA_CONNECTED":
    case "CFA":
      return "Rencontrez vos prochains alternants"
    case "RECRUTEUR_CONNECTED":
    case "RECRUTEUR":
      return "Rencontrez vos prochains candidats"
    default:
      return "Démarrez votre recherche dès à présent !"
  }
}

const getDescription = (userType: IUserType) => {
  switch (userType) {
    case "CFA_CONNECTED":
    case "CFA":
      return "Diffusez les offres de vos entreprises partenaires auprès des candidats en recherche"
    case "RECRUTEUR_CONNECTED":
    case "RECRUTEUR":
      return "Créer votre offre gratuitement, nous nous chargeons de la diffuser auprès des candidats en recherche"
    default:
      return "Renseignez un métier et une localisation pour découvrir les formations et les entreprises qui recrutent"
  }
}

const getButtonLabel = (userType: IUserType) => {
  switch (userType) {
    case "CFA_CONNECTED":
    case "CFA":
    case "RECRUTEUR_CONNECTED":
    case "RECRUTEUR":
      return "Publier une offre"
    default:
      return "Démarrer mes recherches"
  }
}

const getLink = (userType: IUserType) => {
  switch (userType) {
    case "CFA_CONNECTED":
      return `${PAGES.static.backCfaHome.getPath()}?utm_source=lba&utm_medium=website&utm_campaign=lba_ressources_cfa`
    case "CFA":
      return `${PAGES.static.espaceProCreationCfa.getPath()}?utm_source=lba&utm_medium=website&utm_campaign=lba_ressources_cfa`
    case "RECRUTEUR_CONNECTED":
      return `${PAGES.static.backEntrepriseCreationOffre.getPath()}?utm_source=lba&utm_medium=website&utm_campaign=lba_ressources_recruteur`
    case "RECRUTEUR":
      return `${PAGES.static.espaceProCreationEntreprise.getPath()}?utm_source=lba&utm_medium=website&utm_campaign=lba_ressources_recruteur`
    default:
      return `${PAGES.dynamic.recherche(null).getPath()}?utm_source=lba&utm_medium=website&utm_campaign=lba_ressources_alterant`
  }
}

const getImageSrc = (userType: IUserType) => {
  switch (userType) {
    case "CFA_CONNECTED":
    case "CFA":
    case "RECRUTEUR_CONNECTED":
    case "RECRUTEUR":
      return "/images/guides/illu-votre-besoin.svg"
    default:
      return "/images/guides/demarrer-recherche.svg"
  }
}

export const RedirectionInterne = async ({ source }: { source?: string }) => {
  const { user } = await getSession()
  const userType = getUserType({ source, user })

  return (
    <Grid
      container
      size={12}
      spacing={4}
      sx={{
        background: `linear-gradient(90deg, rgba(194, 48, 185, 0.08) 0%, rgba(194, 48, 185, 0.00) 100%), #F5F5FE;`,
      }}
      p={fr.spacing("6v")}
      borderRadius={fr.spacing("1v")}
    >
      <Grid size={{ xs: 12, md: 9 }}>
        <Box display={"flex"} flexDirection={"column"} gap={fr.spacing("4v")} justifyContent={"flex-start"}>
          <Typography variant="h3" color={fr.colors.decisions.text.actionHigh.blueFrance.default}>
            {getTitle(userType)}
          </Typography>
          <Typography fontSize={"1.125rem"}>{getDescription(userType)}</Typography>
          <Button linkProps={{ href: getLink(userType) }} priority="secondary" iconId="fr-icon-arrow-right-line" iconPosition="right">
            {getButtonLabel(userType)}
          </Button>
        </Box>
      </Grid>
      <Grid size={{ xs: 12, md: 3 }} display={"flex"} justifyContent={"flex-end"}>
        <Image width={253} height={164} src={getImageSrc(userType)} alt={"Illustration d'une personne consultant des offres d'emploi sur un ordinateur"} />
      </Grid>
    </Grid>
  )
}
