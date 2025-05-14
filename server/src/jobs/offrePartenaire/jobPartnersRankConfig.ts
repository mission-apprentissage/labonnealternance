import { JOBPARTNERS_LABEL } from "shared/models/jobsPartners.model"

export const jobPartnersRankDefaultFactor = 0.5

/*Source du ranking sur Google drive (document "Agrégation et rediffusion d'offres partenaires")*/
const jobPartnersRankConfigByFlux: Partial<Record<JOBPARTNERS_LABEL, number>> = {
  Hellowork: 0.24,
  "France Travail": 0.22,
  "RH Alternance": 0.3,
  Veritone: 0.7,
  GRDF: 0.7,
  Daher: 0.7,
  "L'Oréal": 0.7,
  "Crédit Mutuel": 0.7,
  BPCE: 0.7,
  Decathlon: 0.7,
  "Institut Pasteur": 0.7  
}

const jobPartnersRankConfigByAPI: Record<string, number> = {}

export const jobPartnersRankConfig = {
  ...jobPartnersRankConfigByAPI,
  ...jobPartnersRankConfigByFlux,
}
