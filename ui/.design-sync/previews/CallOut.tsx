import { Button, CallOut } from "lba-ds"

export const Information = () => (
  <div style={{ maxWidth: 520 }}>
    <CallOut iconId="fr-icon-information-line" title="Qu'est-ce que l'alternance ?">
      L'alternance permet de suivre une formation tout en travaillant en entreprise. Elle regroupe le contrat d'apprentissage et le contrat de professionnalisation, avec une
      rémunération basée sur votre âge et votre niveau de diplôme.
    </CallOut>
  </div>
)

export const AvecAction = () => (
  <div style={{ maxWidth: 520 }}>
    <CallOut iconId="fr-icon-user-line" title="Besoin d'accompagnement ?" buttonProps={{ children: "Contacter un conseiller", priority: "secondary" }}>
      Un conseiller peut vous aider à trouver l'entreprise qui correspond à votre projet professionnel et à préparer votre candidature.
    </CallOut>
  </div>
)
