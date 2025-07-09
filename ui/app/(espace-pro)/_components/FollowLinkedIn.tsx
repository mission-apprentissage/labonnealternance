import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import { Grid2 as Grid, Typography } from "@mui/material"

export const FollowLinkedIn = () => {
  return (
    <Grid container spacing={fr.spacing("15w")} sx={{ alignItems: "center", justifyContent: "center" }}>
      <Grid size={{ xs: 12, md: 9 }}>
        <Typography>La mission ministérielle pour l’apprentissage construit des services numériques qui facilitent les entrées en apprentissage.</Typography>
        <Typography sx={{ fontSize: "32px", fontWeight: "700", color: fr.colors.decisions.text.actionHigh.blueFrance.default }}>
          Rendez-vous sur LinkedIn pour suivre nos actualités
        </Typography>
      </Grid>
      <Grid size={{ xs: 12, md: 3 }}>
        <Button
          linkProps={{ href: "https://www.linkedin.com/company/mission-apprentissage/posts/?feedView=all", target: "_blank" }}
          priority="primary"
          iconId="ri-linkedin-box-fill"
          iconPosition="right"
        >
          Voir notre page
        </Button>
      </Grid>
    </Grid>
  )
}
