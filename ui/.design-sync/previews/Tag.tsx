import { Tag } from "lba-ds"

export const Filtres = () => (
  <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
    <Tag>Apprentissage</Tag>
    <Tag>Professionnalisation</Tag>
    <Tag>Bac +2</Tag>
    <Tag>Télétravail partiel</Tag>
  </div>
)

export const Selectionnables = () => (
  <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
    <Tag pressed nativeButtonProps={{ type: "button" }}>
      Nantes (44)
    </Tag>
    <Tag nativeButtonProps={{ type: "button" }}>Rennes (35)</Tag>
    <Tag nativeButtonProps={{ type: "button" }}>Angers (49)</Tag>
  </div>
)

export const Dismissible = () => (
  <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
    <Tag dismissible nativeButtonProps={{ type: "button" }}>
      Rayon 30 km
    </Tag>
    <Tag dismissible nativeButtonProps={{ type: "button" }}>
      Niveau CAP
    </Tag>
    <Tag dismissible nativeButtonProps={{ type: "button" }}>
      Commerce
    </Tag>
  </div>
)

export const AvecIcone = () => (
  <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
    <Tag iconId="fr-icon-map-pin-2-line">Île-de-France</Tag>
    <Tag iconId="fr-icon-briefcase-line">Contrat 24 mois</Tag>
  </div>
)

export const Small = () => (
  <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
    <Tag small>CDD</Tag>
    <Tag small>CFA</Tag>
    <Tag small>Diplôme RNCP</Tag>
  </div>
)
