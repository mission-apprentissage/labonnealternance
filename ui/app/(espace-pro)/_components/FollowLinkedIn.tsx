import { fr } from "@codegouvfr/react-dsfr"
import { Grid2 as Grid, Typography } from "@mui/material"

import { DsfrLink } from "../../../components/dsfr/DsfrLink"

export const FollowLinkedIn = () => {
  return (
    <Grid container spacing={2} sx={{ alignItems: "center", justifyContent: "center", p: 1 }}>
      <Grid size={{ xs: 12, md: 8 }}>
        <Typography>La mission ministérielle pour l’apprentissage construit des services numériques qui facilitent les entrées en apprentissage.</Typography>
        <Typography component={"h2"} variant="h2" sx={{ color: fr.colors.decisions.text.actionHigh.blueFrance.default }}>
          Rendez-vous sur LinkedIn pour suivre nos actualités
        </Typography>
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <DsfrLink
          href="https://www.linkedin.com/company/mission-apprentissage/posts/?feedView=all"
          aria-label="Accès à la page Linkedin de la mission ministérielle pour l’apprentissage - nouvelle fenêtre"
        >
          Voir notre page
        </DsfrLink>
      </Grid>
    </Grid>
  )
}
