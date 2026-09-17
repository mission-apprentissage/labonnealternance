import { Badge, Button, Stack, Typography } from "lba-ds"

export const InfosOffre = () => (
  <Stack component="div" direction="column" spacing={1} style={{ maxWidth: 420 }}>
    <Typography component="h2" variant="h5">
      Assistant·e ressources humaines
    </Typography>
    <Stack component="div" direction="row" spacing={1}>
      <Badge severity="info">Alternance</Badge>
      <Badge severity="new">Nouvelle offre</Badge>
    </Stack>
    <Typography component="p" variant="body2" color="textSecondary">
      Lyon (69) · Contrat de professionnalisation · 12 mois
    </Typography>
  </Stack>
)

export const ActionsHorizontales = () => (
  <Stack component="div" direction="row" spacing={2} alignItems="center">
    <Button priority="primary">Postuler</Button>
    <Button priority="secondary">Enregistrer</Button>
    <Typography component="span" variant="body2" color="textSecondary">
      Réponse sous 7 jours en moyenne
    </Typography>
  </Stack>
)

export const Etapes = () => (
  <Stack component="div" direction="column" spacing={2} style={{ maxWidth: 380 }}>
    <Typography component="p" variant="body1">
      1. Je recherche une offre d'alternance
    </Typography>
    <Typography component="p" variant="body1">
      2. Je prépare ma candidature
    </Typography>
    <Typography component="p" variant="body1">
      3. J'échange avec le recruteur
    </Typography>
  </Stack>
)
