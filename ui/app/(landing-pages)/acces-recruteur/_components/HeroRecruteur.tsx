import { fr } from "@codegouvfr/react-dsfr"
import { Grid, Box } from "@mui/material"

import { ConnectionActions } from "@/app/(espace-pro)/_components/ConnectionActions"
import { FollowLinkedIn } from "@/app/(espace-pro)/_components/FollowLinkedIn"
import { PromoRessources } from "@/app/(espace-pro)/_components/promoRessources"
import { AlgoRecruteur } from "@/app/(landing-pages)/acces-recruteur/_components/AlgoRecruter"
import { Entreprise } from "@/app/(landing-pages)/acces-recruteur/_components/Entreprise"
import { GerezOffres } from "@/app/(landing-pages)/acces-recruteur/_components/GerezOffres"
import { OffresGratuites } from "@/app/(landing-pages)/acces-recruteur/_components/OffresGratuites"
import { OrganismesMandataires } from "@/app/(landing-pages)/acces-recruteur/_components/OrganismesMandataires"
import { PostezVotreOffre } from "@/app/(landing-pages)/acces-recruteur/_components/PostezVotreOffre"

export const HeroRecruteur = () => {
  return (
    <Grid container spacing={fr.spacing("8w")} sx={{ alignItems: "center", justifyContent: "center" }}>
      <Grid>
        <Entreprise />
      </Grid>
      <Grid>
        <Box sx={{ p: fr.spacing("5w"), borderRadius: "10px", backgroundColor: fr.colors.decisions.background.default.grey.hover }}>
          <Grid container spacing={10} sx={{ alignItems: "center", justifyContent: "center" }}>
            <PostezVotreOffre />
            <OffresGratuites />
            <OrganismesMandataires />
          </Grid>
        </Box>
      </Grid>
      <Grid>
        <Box sx={{ p: fr.spacing("5w"), borderRadius: "10px", backgroundColor: fr.colors.decisions.background.default.grey.hover }}>
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
        <Box sx={{ p: fr.spacing("5w"), borderRadius: "10px", backgroundColor: fr.colors.decisions.background.alt.blueFrance.default }}>
          <FollowLinkedIn />
        </Box>
      </Grid>
    </Grid>
  )
}
