import { Box, Grid2 as Grid, Typography } from "@mui/material"
import Image from "next/image"

import { ConnectionActions } from "@/app/(espace-pro)/_components/ConnectionActions"

export const CFA = () => {
  return (
    <Grid container spacing={5}>
      <Grid size={{ xs: 12, md: 5 }}>
        <Typography variant="h2" component="h2" sx={{ mb: 2, color: "#000091" }}>
          Vous êtes un organisme de formation
        </Typography>

        <Typography variant="h3" component="h3">
          Attirez des candidats en offrant plus de visibilité à vos formations et offres d’emplois
        </Typography>

        <Typography sx={{ mb: 2 }}>Créez le compte de votre CFA pour diffuser les offres de vos entreprises partenaires, et recevoir les candidatures.</Typography>

        <ConnectionActions service="cfa" />
      </Grid>

      <Grid size={{ xs: 0, md: 7 }}>
        <Box>
          <Image src="/images/home_pics/illu-entreprisesmandatees.svg" alt="" width={678} height={337} />
        </Box>
      </Grid>
    </Grid>
  )
}
