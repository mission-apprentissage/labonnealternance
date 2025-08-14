import { fr } from "@codegouvfr/react-dsfr"
import { Box, Typography } from "@mui/material"
import Image from "next/image"

import { RechercheViewType, WithRecherchePageParams } from "@/app/(candidat)/recherche/_utils/recherche.route.utils"

export function RechercheResultatsPlaceholder(props: WithRecherchePageParams) {
  const { viewType } = props.params
  return (
    <Box
      sx={{
        pt: fr.spacing("6w"),
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        gap: fr.spacing("4w"),
        justifyContent: "center",
      }}
    >
      <Image src="/images/dosearch.svg" width={269} height={216} alt="" aria-hidden="true" unoptimized />

      <Box>
        <Box>
          <Typography variant="h1">
            Trouvez votre{" "}
            <Box component="span" sx={{ color: fr.colors.decisions.artwork.minor.blueFrance.default }}>
              alternance
            </Box>
          </Typography>
          <Typography className={fr.cx("fr-text--lead")} style={{ maxWidth: 460 }}>
            {viewType === RechercheViewType.EMPLOI
              ? "Démarrez une recherche pour trouver votre emploi en alternance"
              : viewType === RechercheViewType.FORMATION
                ? "Démarrez une recherche pour trouver votre formation en alternance"
                : "Démarrez une recherche pour trouver votre formation ou votre emploi en alternance"}
          </Typography>
        </Box>
      </Box>
    </Box>
  )
}
