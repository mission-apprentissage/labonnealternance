import { fr } from "@codegouvfr/react-dsfr"
import { Box, Typography } from "@mui/material"

import { DsfrLink } from "@/components/dsfr/DsfrLink"
import { LbaJobEngagementTag } from "@/components/ItemDetail/LbaJobComponents/LbaJobEngagementTag"

export function LbaJobEngagement() {
  return (
    <Box
      sx={{
        border: "solid 1px #DDDDDD",
        borderRadius: "8px",
        padding: fr.spacing("2w"),
        backgroundColor: "white",
      }}
    >
      <LbaJobEngagementTag />
      <Typography sx={{ fontSize: "16px", lineHeight: "24px", marginTop: fr.spacing("1w") }}>
        Cet employeur est reconnu <i>Handi-engagé</i> par France Travail, Cap emploi et leurs partenaires, du fait des actions concrètes qu’il mène en faveur du recrutement
        d’alternants en situation de handicap.{" "}
        <DsfrLink href="/faq?engagement-handicap=1" external aria-label="Accéder à la FAQ - Qu'est-ce qu'un employeur engagé handicap - nouvelle fenêtre">
          En savoir plus
        </DsfrLink>
      </Typography>
    </Box>
  )
}
