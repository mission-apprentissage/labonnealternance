import { Grid, Typography } from "@mui/material"
import Image from "next/image"

export const OrganismesMandataires = () => {
  return (
    <Grid container spacing={2} sx={{ alignItems: "center", justifyContent: "center" }}>
      <Grid size={{ xs: 12, md: 6 }}>
        <Image src="/images/home_pics/illu-solliciterCFA.svg" alt="" aria-hidden={true} width={561} height={378} />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <Typography component="h3" variant="h3" sx={{ mb: 2 }}>
          Identifiez facilement les organismes de formation en lien avec votre offre d’emploi
        </Typography>
        <Typography>Vous pouvez choisir d’être accompagné par les centres de formation et votre OPCO de rattachement, afin d’accélérer vos recrutements.</Typography>
      </Grid>
    </Grid>
  )
}
