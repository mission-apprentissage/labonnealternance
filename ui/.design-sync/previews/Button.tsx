import { Button } from "lba-ds"

export const Priorities = () => (
  <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
    <Button priority="primary">Postuler à l'offre</Button>
    <Button priority="secondary">Voir le détail</Button>
    <Button priority="tertiary">Enregistrer</Button>
    <Button priority="tertiary no outline">Annuler</Button>
  </div>
)

export const Sizes = () => (
  <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
    <Button size="small">Petit</Button>
    <Button size="medium">Moyen</Button>
    <Button size="large">Grand</Button>
  </div>
)

export const WithIcon = () => (
  <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
    <Button iconId="fr-icon-search-line">Rechercher une alternance</Button>
    <Button iconId="fr-icon-arrow-right-line" iconPosition="right">
      Créer mon espace recruteur
    </Button>
  </div>
)

export const Disabled = () => <Button disabled>Candidature envoyée</Button>
