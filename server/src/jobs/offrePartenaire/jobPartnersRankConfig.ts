import type { JOBPARTNERS_LABEL } from "shared/models/jobsPartners.model"

export const jobPartnersRankDefaultFactor = 0.5

/*Source du ranking sur Google drive (document "Agrégation et rediffusion d'offres partenaires")*/
const jobPartnersRankConfigByFlux: Partial<Record<JOBPARTNERS_LABEL, number>> = {
  Hellowork: 0.65,
  "France Travail": 0.5,
  "RH Alternance": 0.4,
  "La Poste": 0.7,
  Jobteaser: 0.61,
  Jooble: 0.58,
  Meteojob: 0.6,
  "annonces Atlas": 0.5,
  "Vite un emploi": 0.5,
  "Nos Talents Nos Emplois": 0.5,
  "Toulouse metropole": 0.5,
}

const jobPartnersRankConfigByAPI: Record<string, number> = {
  Veritone: 0.7,
  GRDF: 0.7,
  Daher: 0.7,
  "L'Oréal": 0.7,
  "Crédit Mutuel": 0.7,
  BPCE: 0.7,
  Decathlon: 0.7,
  "Institut Pasteur": 0.7,
  "Jobs that make sense": 0.62,
}

export const jobPartnersRankConfig = {
  ...jobPartnersRankConfigByAPI,
  ...jobPartnersRankConfigByFlux,
}
