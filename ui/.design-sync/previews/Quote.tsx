import { Quote } from "lba-ds"

export const TemoignageApprenti = () => (
  <div style={{ maxWidth: 520 }}>
    <Quote
      text="Grâce à La Bonne Alternance, j'ai trouvé mon entreprise en trois semaines. Le simulateur de rémunération m'a aidé à préparer mon entretien."
      author="Léa, apprentie en BTS Commerce"
      source="Nantes (44)"
    />
  </div>
)

export const TemoignageRecruteur = () => (
  <div style={{ maxWidth: 520 }}>
    <Quote
      size="large"
      text="Publier une offre nous a permis de recevoir des candidatures ciblées dès le lendemain. Nous avons recruté deux apprentis cette année."
      author="Karim Benali"
      source="Responsable RH, PME du bâtiment"
    />
  </div>
)

export const CitationInstitutionnelle = () => (
  <div style={{ maxWidth: 520 }}>
    <Quote text="L'alternance reste la voie d'insertion professionnelle la plus efficace pour les jeunes." author="Ministère du Travail" source="Rapport apprentissage 2025" />
  </div>
)
