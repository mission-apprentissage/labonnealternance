import { fillLocationInfosForPartners } from "./fillLocationInfosForPartners copy"
import { fillOpcoInfosForPartners } from "./fillOpcoInfosForPartners"
import { fillSiretInfosForPartners } from "./fillSiretInfosForPartners"
import { validateComputedJobPartners } from "./validateComputedJobPartners"

export const fillComputedJobsPartners = async () => {
  await fillOpcoInfosForPartners()
  await fillSiretInfosForPartners()
  await fillLocationInfosForPartners()
  await validateComputedJobPartners()
}
