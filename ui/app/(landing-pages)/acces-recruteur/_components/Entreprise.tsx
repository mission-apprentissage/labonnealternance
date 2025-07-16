import { Box, Grid2 as Grid, Typography } from "@mui/material"
import Image from "next/image"

import { ConnectionActions } from "@/app/(espace-pro)/_components/ConnectionActions"

export const Entreprise = () => {
  return (
    <Grid container spacing={5}>
      <Grid size={{ xs: 12, md: 5 }}>
        <Typography variant="h2" component="h2" sx={{ mb: 2, color: "#000091" }}>
          Vous êtes une entreprise
        </Typography>

        <Typography variant="h3" component="h3">
          Diffusez simplement et gratuitement vos offres en alternance
        </Typography>

        <Typography sx={{ mb: 2 }}>
          Exprimez vos besoins en alternance afin d’être visible auprès des jeunes en recherche de contrat, et des centres de formation pouvant vous accompagner.
        </Typography>

        <ConnectionActions service="entreprise" />
      </Grid>

      <Grid size={{ xs: 0, md: 7 }}>
        <Box>
          <Image src="/images/home_pics/illu-votrebesoin.svg" alt="" width={716} height={414} />
        </Box>
      </Grid>
    </Grid>
  )
}
