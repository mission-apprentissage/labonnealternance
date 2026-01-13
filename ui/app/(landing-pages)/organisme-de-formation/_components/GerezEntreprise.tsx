import { fr } from "@codegouvfr/react-dsfr"
import { Grid, Typography } from "@mui/material"
import Image from "next/image"

export const GerezEntreprise = () => {
  return (
    <Grid container spacing={fr.spacing("4v")} sx={{ alignItems: "center", justifyContent: "center" }}>
      <Grid size={{ xs: 12, md: 6 }}>
        <Image src="/images/home_pics/illu-listeoffres.svg" width={585} height={298} alt="" style={{ width: "100%", height: "auto" }} />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <Typography component="h3" variant="h3" sx={{ mb: fr.spacing("4v") }}>
          Développez et gérez vos entreprises partenaires
        </Typography>
        <Typography>
          3 étapes seulement pour mettre en ligne les besoins de vos entreprises partenaires. Vos offres regroupant formation et emploi seront mises en avant sur les différents
          sites.
        </Typography>
        <Typography>Recevez dans votre boîte mail des demandes de contact d’entreprises en recherche d’alternants.</Typography>
      </Grid>
    </Grid>
  )
}
