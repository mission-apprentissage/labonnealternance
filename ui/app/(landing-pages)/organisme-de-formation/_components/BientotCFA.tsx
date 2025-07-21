import { fr } from "@codegouvfr/react-dsfr"
import { Box, Grid2 as Grid, Typography } from "@mui/material"
import Image from "next/image"

export const BientotCFA = () => {
  return (
    <Grid container spacing={2} sx={{ alignItems: "center", justifyContent: "center" }}>
      <Grid size={{ xs: 12, md: 6 }}>
        <Image src="/images/home_pics/illu-candidatures.svg" alt="" width={571} height={308} />
      </Grid>
      <Grid container size={{ xs: 12, md: 6 }} spacing={fr.spacing("3w")} sx={{ alignItems: "center", justifyContent: "left" }}>
        <Grid>
          <Box
            component="span"
            sx={{
              background: "linear-gradient(90deg,#6a11cb,#2575fc)",
              color: "#fff",
              borderRadius: "80px",
              lineHeight: "32px",
              px: fr.spacing("3w"),
              fontSize: "20px",
              fontWeight: "700",
            }}
          >
            Bientôt
          </Box>
        </Grid>
        <Grid>
          <Typography component="h3" variant="h3" sx={{ mb: 2 }}>
            Gérez vos offres de manière collaborative
          </Typography>
          <Typography>Un accès multi-comptes permettra à plusieurs personnes de votre entreprise d’accéder et de gérer vos offres d&apos;emploi.</Typography>
          <Typography component="h3" variant="h3" sx={{ my: 2 }}>
            Administrez les demandes de RDV des candidats sur vos formations
          </Typography>
          <Typography>Gérez dans votre espace personnel les demandes de rendez-vous envoyées par les candidats intérressés par vos offres d’emploi et de formation.</Typography>
        </Grid>
      </Grid>
    </Grid>
  )
}
