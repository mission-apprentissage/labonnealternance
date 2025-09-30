import { Grid, Typography } from "@mui/material"
import Image from "next/image"

export const PostezVotreOffre = () => {
  return (
    <Grid container spacing={2} sx={{ alignItems: "center", justifyContent: "center" }}>
      <Grid size={{ xs: 12, md: 6 }}>
        <Image src="/images/home_pics/illu-offreemploi.svg" width={529} height={280} alt="" />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <Typography component="h3" variant="h3" sx={{ mb: 2 }}>
          Postez votre offre d'alternance en quelques secondes
        </Typography>
        <Typography>
          Exprimez votre besoin en quelques clics, nous générons votre offre instantanément. Retrouvez vos offres dans votre compte en vous connectant avec votre email uniquement.
        </Typography>
      </Grid>
    </Grid>
  )
}
