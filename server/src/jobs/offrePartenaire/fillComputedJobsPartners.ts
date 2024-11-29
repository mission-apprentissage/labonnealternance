import { fillOpcoInfosForPartners } from "./fillOpcoInfosForPartners"
import { fillRomeForPartners } from "./fillRomeForPartners"
import { fillSiretInfosForPartners } from "./fillSiretInfosForPartners"
import { validateComputedJobPartners } from "./validateComputedJobPartners"

export const fillComputedJobsPartners = async () => {
  await fillOpcoInfosForPartners()
  await fillSiretInfosForPartners()
  await fillRomeForPartners()
  await validateComputedJobPartners()
}
