import { FTJob } from "@/services/ftjob.service.types"

export function generateFtJobFixture(data: Partial<FTJob>): FTJob {
  return {
    id: "1",
    intitule: "Super offre d'apprentissage",
    description: "Attention il te faut une super motivation pour ce job",
    dateCreation: "2024-01-01T00:00:00.000Z",
    dateActualisation: "2024-02-01T00:00:00.000Z",
    lieuTravail: {
      libelle: "",
      latitude: "",
      longitude: "",
      codePostal: "",
      commune: "",
    },
    romeCode: "",
    romeLibelle: "",
    appellationlibelle: "",
    appellationLibelle: "",
    entreprise: {
      nom: "",
      logo: "",
      description: "",
      siret: "",
    },
    typeContrat: "",
    typeContratLibelle: "",
    natureContrat: "",
    experienceExige: "",
    experienceLibelle: "",
    salaire: {},
    alternance: true,
    nombrePostes: 1,
    accessibleTH: true,
    origineOffre: {
      origine: "",
      urlOrigine: "",
      partenaires: [],
    },

    ...data,
  }
}
