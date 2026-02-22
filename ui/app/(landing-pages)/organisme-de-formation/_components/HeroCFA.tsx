import { fr } from "@codegouvfr/react-dsfr"
import { Box, Grid, Typography } from "@mui/material"

import { BientotCFA } from "./BientotCFA"
import { CFA } from "./CFA"
import { FacilitezRDVA } from "./FacilitezRDVA"
import { GerezEntreprise } from "./GerezEntreprise"
import { OffresAutoExposees } from "./OffresAutoExposees"
import { OffresGratuites } from "@/app/(landing-pages)/acces-recruteur/_components/OffresGratuites"
import { PromoRessources } from "@/app/(espace-pro)/_components/promoRessources"
import { FollowLinkedIn } from "@/app/(espace-pro)/_components/FollowLinkedIn"
import { ConnectionActions } from "@/app/(espace-pro)/_components/ConnectionActions"

export const HeroCFA = () => {
  return (
    <Grid container spacing={fr.spacing("16v")} sx={{ alignItems: "center", justifyContent: "center" }}>
      <Grid>
        <CFA />
      </Grid>
      <Grid>
        <Box sx={{ p: fr.spacing("10v"), borderRadius: "10px", backgroundColor: fr.colors.decisions.background.default.grey.hover }}>
          <Grid container spacing={10} sx={{ alignItems: "center", justifyContent: "center" }}>
            <OffresAutoExposees />
            <FacilitezRDVA />
          </Grid>
        </Box>
      </Grid>
      <Grid>
        <Box sx={{ p: fr.spacing("10v"), borderRadius: "10px", backgroundColor: fr.colors.decisions.background.default.grey.hover }}>
          <Grid container spacing={10} sx={{ alignItems: "center", justifyContent: "center" }}>
            <GerezEntreprise />
            <OffresGratuites />
          </Grid>
        </Box>
      </Grid>
      <Grid>
        <Box sx={{ p: fr.spacing("10v"), borderRadius: "10px", backgroundColor: fr.colors.decisions.background.default.grey.hover }}>
          <BientotCFA />
        </Box>
      </Grid>
      <Grid>
        <Box sx={{ backgroundColor: fr.colors.decisions.background.default.grey.default }}>
          <PromoRessources target="cfa" />
        </Box>
      </Grid>
      <Grid>
        <Box sx={{ backgroundColor: fr.colors.decisions.background.default.grey.default }}>
          <Typography variant="h2" sx={{ textAlign: "center" }}>
            Vous souhaitez attirer de nouveaux candidats ?
          </Typography>
          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
            <ConnectionActions service="cfa" />
          </Box>
        </Box>
      </Grid>
      <Grid>
        <Box sx={{ p: fr.spacing("10v"), borderRadius: "10px", backgroundColor: fr.colors.decisions.background.alt.blueFrance.default }}>
          <FollowLinkedIn />
        </Box>
      </Grid>
    </Grid>
  )
}
