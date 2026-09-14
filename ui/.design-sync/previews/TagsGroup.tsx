import { TagsGroup } from "lba-ds"

export const CompetencesOffre = () => (
  <div style={{ maxWidth: 520 }}>
    <TagsGroup tags={[{ children: "Accueil client" }, { children: "Encaissement" }, { children: "Gestion des stocks" }, { children: "Merchandising" }]} />
  </div>
)

export const FiltresRecherche = () => (
  <div style={{ maxWidth: 520 }}>
    <TagsGroup
      tags={[
        { children: "Nantes (44)", dismissible: true, nativeButtonProps: { type: "button" } },
        { children: "Rayon 30 km", dismissible: true, nativeButtonProps: { type: "button" } },
        { children: "Apprentissage", dismissible: true, nativeButtonProps: { type: "button" } },
        { children: "Niveau Bac", dismissible: true, nativeButtonProps: { type: "button" } },
      ]}
    />
  </div>
)

export const Small = () => (
  <div style={{ maxWidth: 520 }}>
    <TagsGroup smallTags tags={[{ children: "CAP" }, { children: "Bac Pro" }, { children: "BTS" }, { children: "Licence Pro" }]} />
  </div>
)
