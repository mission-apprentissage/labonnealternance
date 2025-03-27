import { JOBPARTNERS_LABEL } from "shared/models/jobsPartners.model"

export const jobPartnersRankDefaultFactor = 0.5

/*Source du ranking sur Google drive (document "Agrégation et rediffusion d'offres partenaires")*/
const jobPartnersRankConfigByFlux: Partial<Record<JOBPARTNERS_LABEL, number>> = {
  "Hellowork": 0.7,
  "France Travail": 0.1,
  "RH Alternance": 0.3,
  "Veritone": 0.3
}

const jobPartnersRankConfigByAPI: Record<string, number> = {}

export const jobPartnersRankConfig = {
  ...jobPartnersRankConfigByAPI,
  ...jobPartnersRankConfigByFlux,
}
