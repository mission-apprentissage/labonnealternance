import { Tabs, Typography } from "lba-ds"

export const OffreDetail = () => (
  <div style={{ maxWidth: 640 }}>
    <Tabs
      tabs={[
        {
          label: "Description",
          iconId: "fr-icon-briefcase-line",
          isDefault: true,
          content: (
            <Typography component="p" variant="body2">
              Contrat d'apprentissage de 24 mois pour préparer un BTS SIO. Vous intégrez l'équipe technique d'une PME nantaise et participez au développement d'une application
              métier.
            </Typography>
          ),
        },
        {
          label: "Profil recherché",
          iconId: "fr-icon-account-line",
          content: (
            <Typography component="p" variant="body2">
              Niveau Bac requis, première expérience en développement web appréciée. Rigueur, curiosité et goût du travail en équipe.
            </Typography>
          ),
        },
        {
          label: "Entreprise",
          content: (
            <Typography component="p" variant="body2">
              PME de 30 salariés spécialisée dans les logiciels de gestion, labellisée « Entreprise partenaire de l'alternance ».
            </Typography>
          ),
        },
      ]}
    />
  </div>
)

export const EspaceRecruteur = () => (
  <div style={{ maxWidth: 640 }}>
    <Tabs
      label="Tableau de bord recruteur"
      tabs={[
        {
          label: "Offres en ligne",
          isDefault: true,
          content: (
            <Typography component="p" variant="body2">
              4 offres publiées, 27 candidatures reçues cette semaine.
            </Typography>
          ),
        },
        {
          label: "Candidatures",
          content: (
            <Typography component="p" variant="body2">
              12 candidatures en attente de réponse.
            </Typography>
          ),
        },
        {
          label: "Brouillons",
          disabled: true,
          content: (
            <Typography component="p" variant="body2">
              Aucun brouillon enregistré.
            </Typography>
          ),
        },
      ]}
    />
  </div>
)
