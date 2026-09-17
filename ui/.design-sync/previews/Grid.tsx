import { Grid, Typography } from "lba-ds"

const Cellule = ({ titre, valeur }: { titre: string; valeur: string }) => (
  <div
    style={{
      border: "1px solid #ddd",
      borderTop: "3px solid #000091",
      padding: 16,
      height: "100%",
    }}
  >
    <Typography component="p" variant="h4" color="primary">
      {valeur}
    </Typography>
    <Typography component="p" variant="body2" color="textSecondary">
      {titre}
    </Typography>
  </div>
)

export const IndicateursAlternance = () => (
  <Grid container spacing={2} style={{ maxWidth: 640 }}>
    <Grid size={{ xs: 6, md: 3 }}>
      <Cellule titre="Offres en ligne" valeur="8 240" />
    </Grid>
    <Grid size={{ xs: 6, md: 3 }}>
      <Cellule titre="Candidatures / semaine" valeur="1 312" />
    </Grid>
    <Grid size={{ xs: 6, md: 3 }}>
      <Cellule titre="CFA partenaires" valeur="640" />
    </Grid>
    <Grid size={{ xs: 6, md: 3 }}>
      <Cellule titre="Taux de mise en relation" valeur="37 %" />
    </Grid>
  </Grid>
)

export const DeuxColonnes = () => (
  <Grid container spacing={3} style={{ maxWidth: 640 }}>
    <Grid size={{ xs: 12, md: 8 }}>
      <Typography component="h2" variant="h5" gutterBottom>
        Développeur·se web en alternance
      </Typography>
      <Typography component="p" variant="body2">
        Contrat d'apprentissage de 24 mois au sein d'une PME nantaise du secteur numérique. Formation en BTS SIO assurée par un CFA partenaire.
      </Typography>
    </Grid>
    <Grid size={{ xs: 12, md: 4 }}>
      <Typography component="p" variant="body2" color="textSecondary">
        Nantes (44)
      </Typography>
      <Typography component="p" variant="body2" color="textSecondary">
        Publiée le 02/09/2026
      </Typography>
    </Grid>
  </Grid>
)
