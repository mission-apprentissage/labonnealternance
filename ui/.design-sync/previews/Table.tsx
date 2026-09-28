import { Table } from "lba-ds"

export const Candidatures = () => (
  <Table
    caption="Candidatures reçues sur vos offres d'alternance"
    headers={["Candidat", "Offre", "Date", "Statut"]}
    data={[
      ["Sofia Martin", "Développeur·se web", "02/09/2026", "À traiter"],
      ["Lucas Nguyen", "Assistant·e RH", "01/09/2026", "Entretien"],
      ["Inès Dubois", "Commercial·e", "28/08/2026", "Refusée"],
      ["Théo Bernard", "Développeur·se web", "27/08/2026", "Recrutée"],
    ]}
    bordered
  />
)

export const OffresPubliees = () => (
  <Table
    caption="Vos offres publiées"
    headers={["Intitulé", "Ville", "Type de contrat", "Vues"]}
    data={[
      ["Développeur·se web", "Nantes (44)", "Apprentissage", "342"],
      ["Assistant·e RH", "Lyon (69)", "Professionnalisation", "128"],
      ["Cuisinier·ère", "Rennes (35)", "Apprentissage", "89"],
    ]}
    fixed
  />
)
