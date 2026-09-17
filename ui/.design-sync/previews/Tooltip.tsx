import { Tooltip, Typography } from "lba-ds"

export const SurvolInfo = () => (
  <Typography component="span" variant="body1">
    Taux de rupture du contrat <Tooltip kind="hover" title="Part des contrats d'apprentissage rompus avant leur terme sur l'année 2025." />
  </Typography>
)

export const AuClic = () => (
  <Typography component="span" variant="body1">
    Zone de mobilité <Tooltip kind="click" title="Rayon autour de la commune recherchée dans lequel les offres d'alternance sont affichées." />
  </Typography>
)
