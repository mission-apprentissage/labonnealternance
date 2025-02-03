import { JOBPARTNERS_LABEL } from "shared/models/jobsPartners.model"

export const jobPartnersRankDefaultFactor = 0.5

export const jobPartnersRankConfig: Partial<Record<JOBPARTNERS_LABEL, number>> = {
  Hellowork: 0.7,
}
