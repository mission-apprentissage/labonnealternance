import { fillLocationInfosForPartners } from "./fillLocationInfosForPartners"
import { fillOpcoInfosForPartners } from "./fillOpcoInfosForPartners"
import { fillRomeForPartners } from "./fillRomeForPartners"
import { fillSiretInfosForPartners } from "./fillSiretInfosForPartners"
import { validateComputedJobPartners } from "./validateComputedJobPartners"

export const fillComputedJobsPartners = async () => {
  await fillOpcoInfosForPartners()
  await fillSiretInfosForPartners()
  await fillLocationInfosForPartners()
  await fillRomeForPartners()
  await validateComputedJobPartners()
}
