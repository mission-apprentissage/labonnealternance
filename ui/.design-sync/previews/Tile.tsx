import { Tile } from "lba-ds"

export const AccesRapide = () => (
  <div style={{ maxWidth: 360 }}>
    <Tile title="Trouver une alternance" desc="Recherchez parmi des milliers d'offres d'apprentissage et de professionnalisation." linkProps={{ href: "/recherche" }} />
  </div>
)

export const Horizontale = () => (
  <div style={{ maxWidth: 520 }}>
    <Tile
      orientation="horizontal"
      title="Déposer une offre"
      desc="Recrutez votre prochain apprenti en quelques minutes depuis votre espace recruteur."
      detail="Espace recruteur"
      linkProps={{ href: "/espace-pro" }}
    />
  </div>
)

export const SansBordure = () => (
  <div style={{ maxWidth: 360 }}>
    <Tile
      noBorder
      title="Simuler ma rémunération"
      desc="Estimez votre salaire d'apprenti selon votre âge et votre année de contrat."
      detail="Outil gratuit"
      linkProps={{ href: "/simulateur" }}
    />
  </div>
)

export const Grise = () => (
  <div style={{ maxWidth: 360 }}>
    <Tile grey title="Trouver un CFA" desc="Localisez les centres de formation près de chez vous et leurs formations." linkProps={{ href: "/cfa" }} />
  </div>
)
