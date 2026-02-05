import type { JOBPARTNERS_LABEL } from "shared/models/jobsPartners.model"

export const jobPartnersRankDefaultFactor = 0.5

/*Source du ranking sur Google drive (document "Agrégation et rediffusion d'offres partenaires")*/
const jobPartnersRankConfigByFlux: Partial<Record<JOBPARTNERS_LABEL, number>> = {
  Hellowork: 0.69,
  Kelio: 0.7,
  "La Poste": 0.7,
  Meteojob: 0.66,
  "France Travail": 0.66,
  Jobteaser: 0.67,
  Jooble: 0.55,
  Décathlon: 0.7,
  "RH Alternance": 0.63,
  "annonces Atlas": 0.5,
  "Vite un emploi": 0.5,
  "Nos Talents Nos Emplois": 0.5,
  "Toulouse metropole": 0.5,
}

const jobPartnersRankConfigByAPI: Record<string, number> = {
  "Action Logement": 0.7,
  "Air France": 0.7,
  Amazon: 0.7,
  BPCE: 0.7,
  Cmonalternance: 0.5,
  "Crédit Mutuel": 0.7,
  Daher: 0.7,
  Decathlon: 0.7,
  EDF: 0.7,
  ENGIE: 0.7,
  GRDF: 0.7,
  "Groupe ADP": 0.7,
  "Institut Pasteur": 0.7,
  Jobposting: 0.7,
  "L'Oreal": 0.7,
  "L'Oréal": 0.7,
  "Le bon coin emploi": 0.64,
  "Nos Talents Nos Emplois": 0.5,
  Veritone: 0.7,
  "Vite un emploi": 0.5,
  Wink: 0.7,

  "annonces Atlas": 0.5,
  iquesta: 0.7,

  "Jobs that make sense": 0.68,
  "Toulouse metropole": 0.5,
  "Engagement Jeune": 0.65,
}

export const jobPartnersRankConfig = {
  ...jobPartnersRankConfigByAPI,
  ...jobPartnersRankConfigByFlux,
}
