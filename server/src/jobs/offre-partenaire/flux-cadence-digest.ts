import { getDbCollection } from "@/common/utils/mongodb-utils"

export type FluxCadence = { runs: number; skipped: number; changed: number; changed_at: Date | null }

/** Par partenaire : runs, runs sautés et changements détectés depuis `since`, date du dernier changement (#5669). */
export const getFluxCadenceByPartner = async (since: Date): Promise<Map<string, FluxCadence>> => {
  const signals = await getDbCollection("jobs_partners_flux_signals").find({}).toArray()
  return new Map(
    signals.map(({ partner_label, checks, changed_at }) => {
      const recent = (checks ?? []).filter(({ checked_at }) => checked_at >= since)
      return [
        partner_label,
        {
          runs: recent.length,
          skipped: recent.filter(({ skipped }) => skipped).length,
          changed: recent.filter(({ changed }) => changed).length,
          changed_at: changed_at ?? null,
        },
      ]
    })
  )
}
