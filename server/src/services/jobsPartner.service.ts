import { BusinessErrorCodes } from "shared/constants/errorCodes"
import { COMPUTED_ERROR_SOURCE, IComputedJobsPartners } from "shared/models/jobsPartnersComputed.model"

export const isJobPartnerCompanyClosed = (jobPartner: Partial<Pick<IComputedJobsPartners, "errors">>) =>
  Boolean(jobPartner?.errors?.find((error) => error?.source === COMPUTED_ERROR_SOURCE.API_SIRET && error.error === BusinessErrorCodes.CLOSED))
