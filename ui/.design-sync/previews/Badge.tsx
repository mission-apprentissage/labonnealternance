import { Badge } from "lba-ds"

export const Severities = () => (
  <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
    <Badge severity="new">Nouvelle offre</Badge>
    <Badge severity="info">Apprentissage</Badge>
    <Badge severity="success">Candidature acceptée</Badge>
    <Badge severity="warning">Profil incomplet</Badge>
    <Badge severity="error">Offre expirée</Badge>
  </div>
)

export const StatutsCandidature = () => (
  <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
    <Badge severity="info">Candidature envoyée</Badge>
    <Badge severity="success">Entretien planifié</Badge>
    <Badge severity="warning">En attente de réponse</Badge>
  </div>
)

export const Small = () => (
  <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
    <Badge small severity="new">
      CDD 12 mois
    </Badge>
    <Badge small severity="info">
      Alternance
    </Badge>
    <Badge small severity="success">
      CFA partenaire
    </Badge>
  </div>
)

export const SansIcone = () => (
  <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
    <Badge noIcon severity="info">
      Bac +2
    </Badge>
    <Badge noIcon severity="new">
      Télétravail partiel
    </Badge>
  </div>
)
