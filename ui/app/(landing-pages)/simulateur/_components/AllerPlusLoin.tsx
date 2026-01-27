import { fr } from "@codegouvfr/react-dsfr"
import { Box, Divider, Grid, Typography } from "@mui/material"
import { Card } from "@codegouvfr/react-dsfr/Card"

const CardItem = ({ title, description, href }: { title: string; description: string; href: string }) => (
  <Grid size={{ xs: 12, md: 4 }}>
    <Card
      title={title}
      titleAs="h3"
      desc={description}
      size="medium"
      background
      shadow
      linkProps={{
        href: href,
      }}
      enlargeLink
      style={{
        height: "100%",
        padding: fr.spacing("1v"),
      }}
    />
  </Grid>
)

export const AllerPlusLoin = () => (
  <Box>
    <Typography variant="h2">Pour aller plus loin</Typography>
    <Divider sx={{ width: "65px", height: 0, background: "none", borderBottom: "5px solid", borderColor: fr.colors.decisions.border.default.blueFrance.default }} />
    <Grid container spacing={2} mt={2}>
      <CardItem
        title="Découvrir les aides auxquelles j'ai droit"
        description="Avant de démarrer la simulation de vos aides, pensez à vous munir de vos ressources et de celles de votre entreprise"
        href="https://mes-aides.1jeune1solution.beta.gouv.fr/"
      />
      <CardItem
        title="Rechercher une entreprise"
        description="Renseignez le métier qui vous intéresse et votre localisation pour découvrir les entreprises qui recrutent"
        href="/"
      />
      <CardItem
        title="Toutes nos ressources sur l'alternance"
        description="Découvrez de nombreuses informations, outils et liens utiles pour bien préparer votre alternance"
        href="/ressources"
      />
    </Grid>
  </Box>
)
