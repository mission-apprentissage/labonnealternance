import { Badge, Button, Card } from "lba-ds"

export const OffreAlternance = () => (
  <div style={{ maxWidth: 360 }}>
    <Card
      title="Développeur·se web en alternance"
      desc="Rejoignez une équipe produit pour construire les services numériques de l'emploi. Contrat d'apprentissage de 24 mois."
      start={<Badge severity="new">Nouvelle offre</Badge>}
      detail="Paris (75) · Apprentissage"
      end={<Button priority="primary">Postuler</Button>}
      border
      background
      enlargeLink={false}
    />
  </div>
)

export const Horizontale = () => (
  <Card
    horizontal
    title="Assistant·e ressources humaines"
    desc="Contrat de professionnalisation d'un an, au sein d'un CFA partenaire."
    detail="Lyon (69) · Professionnalisation"
    badge={<Badge severity="info">Alternance</Badge>}
    end={<Button priority="secondary">Voir le détail</Button>}
    border
  />
)

export const Grise = () => (
  <div style={{ maxWidth: 360 }}>
    <Card
      grey
      title="Vous n'avez pas encore d'espace ?"
      desc="Créez votre compte recruteur pour déposer une offre en quelques minutes."
      end={<Button priority="tertiary">Créer mon espace</Button>}
    />
  </div>
)
