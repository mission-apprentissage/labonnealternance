import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import { Grid2 as Grid, Typography } from "@mui/material"

export const FollowLinkedIn = () => {
  return (
    <Grid container spacing={fr.spacing("4w")} sx={{ alignItems: "center", justifyContent: "center" }}>
      <Grid size={{ xs: 12, md: 9 }}>
        <Typography sx={{ fontWeight: "700", mb: fr.spacing("2w") }}>
          La bonne alternance est édité par la Délégation générale à l’emploi et à la formation professionnelle (DGEFP) et conçoit des services numériques qui facilitent les
          entrées en apprentissage.
        </Typography>
        <Typography component="h2" variant="h2" sx={{ color: fr.colors.decisions.text.actionHigh.blueFrance.default }}>
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
          Voir notre page LinkedIn
        </Button>
      </Grid>
    </Grid>
  )
}
