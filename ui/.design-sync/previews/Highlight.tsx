import { Highlight } from "lba-ds"

export const ConseilCandidat = () => (
  <div style={{ maxWidth: 520 }}>
    <Highlight>
      Personnalisez chaque candidature : une lettre de motivation adaptée à l'entreprise double vos chances d'obtenir un entretien pour votre contrat d'apprentissage.
    </Highlight>
  </div>
)

export const InfoContrat = () => (
  <div style={{ maxWidth: 520 }}>
    <Highlight size="lg">
      En contrat d'apprentissage, votre formation en CFA est intégralement financée par l'opérateur de compétences (OPCO) de votre entreprise. Aucun frais de scolarité n'est à
      votre charge.
    </Highlight>
  </div>
)

export const Petit = () => (
  <div style={{ maxWidth: 520 }}>
    <Highlight size="sm">Les offres sont mises à jour chaque nuit à partir des données France Travail.</Highlight>
  </div>
)
