import { Breadcrumb } from "lba-ds"

export const FilAriane = () => (
  <Breadcrumb
    homeLinkProps={{ href: "/" }}
    segments={[
      { label: "Trouver une alternance", linkProps: { href: "/recherche" } },
      { label: "Offres à Nantes", linkProps: { href: "/recherche?lieu=nantes" } },
    ]}
    currentPageLabel="Développeur web en apprentissage"
  />
)

export const EspaceRecruteur = () => (
  <Breadcrumb
    homeLinkProps={{ href: "/" }}
    segments={[
      { label: "Espace recruteur", linkProps: { href: "/espace-pro" } },
      { label: "Mes offres", linkProps: { href: "/espace-pro/offres" } },
    ]}
    currentPageLabel="Créer une offre d'alternance"
  />
)
