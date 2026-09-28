import { Typography } from "lba-ds"

export const HierarchieOffre = () => (
  <div style={{ maxWidth: 560 }}>
    <Typography component="h1" variant="h3" gutterBottom>
      Développeur·se web en alternance
    </Typography>
    <Typography component="p" variant="subtitle1" color="textSecondary" gutterBottom>
      Nantes (44) · Contrat d'apprentissage · 24 mois
    </Typography>
    <Typography component="p" variant="body1" gutterBottom>
      Rejoignez une équipe produit pour construire les services numériques de l'emploi et de l'alternance.
    </Typography>
    <Typography component="p" variant="body2" color="textSecondary">
      Offre publiée le 2 septembre 2026 · Référence LBA-2026-4821
    </Typography>
  </div>
)

export const Statuts = () => (
  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
    <Typography component="p" variant="body1" color="success">
      Candidature transmise au recruteur
    </Typography>
    <Typography component="p" variant="body1" color="error">
      Offre expirée, candidature impossible
    </Typography>
    <Typography component="p" variant="body1" color="primary">
      3 nouvelles offres correspondent à votre recherche
    </Typography>
  </div>
)

export const Titres = () => (
  <div>
    <Typography component="h1" variant="h1">
      Alternance
    </Typography>
    <Typography component="h2" variant="h2">
      Trouver une offre
    </Typography>
    <Typography component="h3" variant="h4">
      Recruter un apprenti
    </Typography>
    <Typography component="p" variant="caption" color="textSecondary">
      La Bonne Alternance — un service de la mission apprentissage
    </Typography>
  </div>
)
