import { fr } from "@codegouvfr/react-dsfr"
import { Grid, Typography } from "@mui/material"
import Image from "next/image"

import { ConnectionActions } from "@/app/(espace-pro)/_components/ConnectionActions"

export const Entreprise = () => {
  return (
    <Grid container spacing={fr.spacing("10v")}>
      <Grid size={{ xs: 12, md: 6 }}>
        <Typography variant="h1" component="h1" sx={{ mb: fr.spacing("4v"), color: "#000091" }}>
          Vous êtes une entreprise
        </Typography>

        <Typography variant="h2" component="h2">
          Diffusez simplement et gratuitement vos offres en alternance
        </Typography>

        <Typography sx={{ my: fr.spacing("4v") }}>
          Exprimez vos besoins en alternance afin d’être visible auprès des jeunes en recherche de contrat, et des centres de formation pouvant vous accompagner.
        </Typography>

        <ConnectionActions service="entreprise" />
      </Grid>

      <Grid size={{ xs: 12, md: 6 }} sx={{ display: { xs: "none", md: "block" } }}>
        <Image src="/images/home_pics/illu-votrebesoin.svg" alt="" width={600} height={414} />
      </Grid>
    </Grid>
  )
}
