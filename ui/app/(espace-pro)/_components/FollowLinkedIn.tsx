import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import { Box, Grid, Typography } from "@mui/material"

export const FollowLinkedIn = () => {
  return (
    <Grid
      container
      sx={{
        mt: fr.spacing("16v"),
        backgroundColor: fr.colors.decisions.background.alt.blueFrance.default,
        borderRadius: fr.spacing("2v"),
        padding: { md: fr.spacing("12v"), xs: fr.spacing("3v") },
      }}
      spacing={fr.spacing("8v")}
    >
      <Grid size={{ md: 9, xs: 12 }} display={"flex"} flexDirection={"column"} gap={fr.spacing("4v")}>
        <Typography fontWeight={"bold"} textAlign={{ md: "start", xs: "center" }}>
          La bonne alternance est édité par la Délégation générale à l’emploi et à la formation professionnelle (DGEFP) et conçoit des services numériques qui facilitent les
          entrées en apprentissage.
        </Typography>
        <Typography component={"h2"} variant={"h2"} color={fr.colors.decisions.text.title.blueFrance.default} textAlign={{ md: "start", xs: "center" }}>
          Rendez-vous sur LinkedIn pour suivre nos actualités
        </Typography>
      </Grid>
      <Grid size={{ md: 3, xs: 12 }} sx={{ my: "auto" }}>
        <Box sx={{ display: "flex", flexDirection: "row", my: "auto", justifyContent: "center" }}>
          <Button linkProps={{ href: "https://www.linkedin.com/company/la-bonne-alternance/posts/" }} priority="primary">
            Voir notre page LinkedIn
          </Button>
        </Box>
      </Grid>
    </Grid>
  )
}
