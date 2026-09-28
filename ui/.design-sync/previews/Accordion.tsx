import { Accordion } from "lba-ds"

export const QuestionCandidat = () => (
  <div style={{ maxWidth: 520 }}>
    <Accordion label="Quelle est la différence entre apprentissage et professionnalisation ?" defaultExpanded>
      Le contrat d'apprentissage vise l'obtention d'un diplôme ou titre inscrit au RNCP, tandis que le contrat de professionnalisation permet d'acquérir une qualification reconnue
      dans le cadre de la formation continue. Les deux alternent périodes en entreprise et en centre de formation.
    </Accordion>
  </div>
)

export const FaqRecruteur = () => (
  <div style={{ maxWidth: 520 }}>
    <Accordion label="Comment publier une offre d'alternance ?">
      Créez votre espace recruteur, renseignez le SIRET de votre établissement puis décrivez le poste. Votre offre est diffusée sur La Bonne Alternance sous 24 heures.
    </Accordion>
    <Accordion label="Combien de temps mon offre reste-t-elle en ligne ?">
      Une offre reste active 60 jours. Vous pouvez la prolonger ou la clôturer à tout moment depuis votre tableau de bord.
    </Accordion>
    <Accordion label="Qui peut voir mes coordonnées ?">Seuls les candidats ayant postulé à votre offre reçoivent vos coordonnées par e-mail.</Accordion>
  </div>
)
