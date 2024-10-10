import { fillOpcoInfosForPartners } from "./fillOpcoInfosForPartners"
import { fillSiretInfosForPartners } from "./fillSiretInfosForPartners"

export const fillComputedJobsPartners = async () => {
  await fillOpcoInfosForPartners()
  await fillSiretInfosForPartners()
}
