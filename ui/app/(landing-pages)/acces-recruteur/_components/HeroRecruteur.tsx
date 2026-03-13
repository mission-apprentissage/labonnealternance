import { fr } from "@codegouvfr/react-dsfr"
import { Box, Grid } from "@mui/material"
import { ConnectionActions } from "@/app/(espace-pro)/_components/ConnectionActions"
import { FollowLinkedIn } from "@/app/(espace-pro)/_components/FollowLinkedIn"
import { PromoRessources } from "@/app/(espace-pro)/_components/promoRessources"
import { AlgoRecruteur } from "./AlgoRecruter"
import { Entreprise } from "./Entreprise"
import { GerezOffres } from "./GerezOffres"
import { OffresGratuites } from "./OffresGratuites"
import { OrganismesMandataires } from "./OrganismesMandataires"
import { PostezVotreOffre } from "./PostezVotreOffre"

export const HeroRecruteur = () => {
  return (
    <Grid container spacing={fr.spacing("16v")} sx={{ alignItems: "center", justifyContent: "center" }}>
      <Grid>
        <Entreprise />
      </Grid>
      <Grid>
        <Box sx={{ p: fr.spacing("10v"), borderRadius: "10px", backgroundColor: fr.colors.decisions.background.default.grey.hover }}>
          <Grid container spacing={10} sx={{ alignItems: "center", justifyContent: "center" }}>
            <PostezVotreOffre />
            <OffresGratuites />
            <OrganismesMandataires />
          </Grid>
        </Box>
      </Grid>
      <Grid>
        <Box sx={{ p: fr.spacing("10v"), borderRadius: "10px", backgroundColor: fr.colors.decisions.background.default.grey.hover }}>
          <GerezOffres />
        </Box>
      </Grid>
      <Grid>
        <AlgoRecruteur withLinks={true} />
      </Grid>
      <Grid>
        <Box sx={{ backgroundColor: fr.colors.decisions.background.default.grey.default }}>
          <PromoRessources target="recruteur" />
        </Box>
      </Grid>
      <Grid>
        <Box sx={{ backgroundColor: fr.colors.decisions.background.default.grey.default }}>
          <Box sx={{ typography: "h2", textAlign: "center" }}> Vous souhaitez recruter un alternant pour votre entreprise ?</Box>
          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
            <ConnectionActions service="entreprise" />
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
