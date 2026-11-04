import { getDbCollection } from "@/common/utils/mongodb-utils"
import { formatSlackTable } from "@/common/utils/slack-utils"

const formatParisDate = new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Paris", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })

/** Section du bilan nocturne : par partenaire, runs, runs sautés et changements détectés depuis `since` (#5669). */
export const formatFluxCadenceSection = async (since: Date): Promise<string[]> => {
  const signals = await getDbCollection("jobs_partners_flux_signals").find({}).sort({ partner_label: 1 }).toArray()
  if (signals.length === 0) return []

  const rows = signals.map(({ partner_label, checks, changed_at }) => {
    const recent = (checks ?? []).filter(({ checked_at }) => checked_at >= since)
    const skippedCount = recent.filter(({ skipped }) => skipped).length
    const changedCount = recent.filter(({ changed }) => changed).length
    const lastChange = changed_at ? formatParisDate.format(changed_at) : "jamais"
    return [partner_label, String(recent.length), String(skippedCount), String(changedCount), lastChange]
  })
  return [
    "",
    "Cadence de changement des flux :",
    ...formatSlackTable(["Partenaire", "Runs", "Sautés", "Chgts", "Dernier chgt"], rows, { alignRight: [false, true, true, true, false] }),
  ]
}
