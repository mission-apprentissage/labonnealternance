"use client"

import { fr } from "@codegouvfr/react-dsfr"
import { Box, Typography } from "@mui/material"

import { RechercheMobileForm } from "./RechercheMobileForm"
import type { IRecherchePageParams} from "@/app/(candidat)/(recherche)/recherche/_utils/recherche.route.utils";
import { RechercheViewType } from "@/app/(candidat)/(recherche)/recherche/_utils/recherche.route.utils"

const titles = {
  default: "Trouvez emploi et formation",
  [RechercheViewType.EMPLOI]: "Trouvez votre emploi",
  [RechercheViewType.FORMATION]: "Trouvez votre formation",
}

export function RechercheMobileHome(props: { rechercheParams: IRecherchePageParams }) {
  const { viewType } = props.rechercheParams
  return (
    <Box
      sx={{
        py: fr.spacing("2w"),
        px: fr.spacing("1w"),
        backgroundColor: fr.colors.decisions.background.default.grey.default,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Typography variant="h1" marginBottom={fr.spacing("2w")}>
        {titles[viewType] ?? titles.default}{" "}
        <Box component="span" sx={{ color: fr.colors.decisions.artwork.minor.blueFrance.default }}>
          en alternance
        </Box>
      </Typography>
      <RechercheMobileForm {...props} />
    </Box>
  )
}
