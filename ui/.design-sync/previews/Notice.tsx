import { Notice } from "lba-ds"

export const InfoMaintenance = () => (
  <Notice title="Mise à jour des offres" description="Les offres d'alternance sont actualisées chaque nuit. De nouvelles opportunités peuvent apparaître demain matin." />
)

export const Avertissement = () => (
  <Notice severity="warning" title="Complétez votre profil" description="Ajoutez votre CV pour que les recruteurs puissent évaluer votre candidature." />
)

export const AvecLien = () => (
  <Notice
    title="Nouveau simulateur de rémunération"
    description="Estimez votre futur salaire d'apprenti en quelques clics."
    link={{ text: "Accéder au simulateur", linkProps: { href: "/simulateur" } }}
  />
)

export const Fermable = () => (
  <Notice
    isClosable
    severity="info"
    title="Vos données sont protégées"
    description="La Bonne Alternance ne partage vos coordonnées qu'avec les recruteurs auxquels vous postulez."
  />
)
