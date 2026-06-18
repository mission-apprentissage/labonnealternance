import { JOBPARTNERS_LABEL, jobPartnersExcludedFromFlux } from "shared/models/jobsPartners.model"
import { JOBS_PARTNERS_OFFER_ORIGIN } from "shared/models/jobsPartnersComputed.model"
import { getDbCollection } from "@/common/utils/mongodbUtils"

const ORIGIN_MAP: Record<string, string> = {
  "": JOBS_PARTNERS_OFFER_ORIGIN.LBA,
  lba: JOBS_PARTNERS_OFFER_ORIGIN.LBA,
  matcha: JOBS_PARTNERS_OFFER_ORIGIN.LBA,
  tutorial: JOBS_PARTNERS_OFFER_ORIGIN.LBA,
  "cfa-xxx": JOBS_PARTNERS_OFFER_ORIGIN.LBA,
  "campagne-lbb-batch2-PME50k": JOBS_PARTNERS_OFFER_ORIGIN.LBA,
  "campagne-lbb83naf5556-20220616": JOBS_PARTNERS_OFFER_ORIGIN.LBA,
  "campagne-lbb80naf41to43-20220623": JOBS_PARTNERS_OFFER_ORIGIN.LBA,
  "campagne-lbb50naf45-20220712": JOBS_PARTNERS_OFFER_ORIGIN.LBA,
  "campagne-lbb85-20220609": JOBS_PARTNERS_OFFER_ORIGIN.LBA,
  "campagne-lba90-20220517": JOBS_PARTNERS_OFFER_ORIGIN.LBA,
  "campagne-animation-202209": JOBS_PARTNERS_OFFER_ORIGIN.LBA,
  "campagne-naf64-20222909": JOBS_PARTNERS_OFFER_ORIGIN.LBA,
  "campagne-animationjuillet2022utm_campaign=animationjuilletentreprises2022&utm_source=mailing&utm_medium=SIB": JOBS_PARTNERS_OFFER_ORIGIN.LBA,
  "medef-campagnemailingrelancejuin2022": JOBS_PARTNERS_OFFER_ORIGIN.LBA,
  portailalternance: "Portail de l'alternance",
  portailalt: "Portail de l'alternance",
  "opcoep-proximite2023": "Portail de l'alternance",
  "1J1S": "1jeune1solution",
  "1jeune1solution": "1jeune1solution",
  redirec_from_widget_1j1s: "1jeune1solution",
  "opcoep-CRM": "OPCO EP",
  "opcoep-HUBE": "OPCO EP",
  "campagne-opcoepmailing-juin2022": "OPCO EP",
  "campagne-jeunes-sans-contrat-opcoEP-novembre2022": "OPCO EP",
  "opcoep-campagne-phoning-juin2022": "OPCO EP",
  akto: "OPCO Akto",
  opco2i: "OPCO 2i",
  opco2iemailingjuillet2021: "OPCO 2i",
  constructys: "OPCO Constructys",
  atlas: "OPCO Atlas",
  sante: "OPCO Santé",
  lesentreprises_sengagent: "Les entreprises s'engagent",
  "lesentreprises-sengagent": "Les entreprises s'engagent",
  redirec_from_widget_lesentreprisessengagent: "Les entreprises s'engagent",
}

const LBA_PARTNER_LABELS = jobPartnersExcludedFromFlux as string[]

const FLUX_PARTNER_LABELS = Object.values(JOBPARTNERS_LABEL).filter((label) => !LBA_PARTNER_LABELS.includes(label))

//TODO Scrapping partners doivent être identifiés

const SCRAPPING_PARTNER_LABELS = ["Amazon", "BPCE", "Bpifrance", "Daher", "Engie", "Formaposte", "Framatome", "GRDF", "Institut Pasteur", "L'Oreal", "Serpe", "Thales", "Veritone"]

export const up = async () => {
  const collection = getDbCollection("jobs_partners")

  const total = await collection.countDocuments({ offer_origin: { $ne: null } })
  console.info(`Migration offer_origin : ${total} document(s) avec une valeur non-null à traiter`)

  let totalModified = 0

  const fluxFilter = { partner_label: { $in: FLUX_PARTNER_LABELS } }
  const fluxCount = await collection.countDocuments(fluxFilter)
  console.info(`offer_origin → "${JOBS_PARTNERS_OFFER_ORIGIN.FLUX}" pour partenaires flux : ${fluxCount} document(s) concerné(s)`)
  if (fluxCount > 0) {
    const fluxResult = await collection.updateMany(fluxFilter, { $set: { offer_origin: JOBS_PARTNERS_OFFER_ORIGIN.FLUX } })
    totalModified += fluxResult.modifiedCount
    console.info(`offer_origin → "${JOBS_PARTNERS_OFFER_ORIGIN.FLUX}" : ${fluxResult.modifiedCount}/${fluxCount} document(s) mis à jour`)
  }

  for (const [from, to] of Object.entries(ORIGIN_MAP)) {
    const count = await collection.countDocuments({ offer_origin: from, partner_label: { $in: LBA_PARTNER_LABELS } })
    if (count === 0) {
      console.info(`offer_origin "${from}" : aucun document trouvé, passage à la suivante`)
      continue
    }
    const result = await collection.updateMany({ offer_origin: from, partner_label: { $in: LBA_PARTNER_LABELS } }, { $set: { offer_origin: to } })
    totalModified += result.modifiedCount
    console.info(`offer_origin "${from}" → "${to}" : ${result.modifiedCount}/${count} document(s) mis à jour`)
  }

  const scrappingFilter = { partner_label: { $in: SCRAPPING_PARTNER_LABELS } }
  const scrappingCount = await collection.countDocuments(scrappingFilter)
  console.info(`offer_origin → "${JOBS_PARTNERS_OFFER_ORIGIN.SCRAPPING}" pour partenaires scrapping : ${scrappingCount} document(s) concerné(s)`)
  if (scrappingCount > 0) {
    const scrappingResult = await collection.updateMany(scrappingFilter, { $set: { offer_origin: JOBS_PARTNERS_OFFER_ORIGIN.SCRAPPING } })
    totalModified += scrappingResult.modifiedCount
    console.info(`offer_origin → "${JOBS_PARTNERS_OFFER_ORIGIN.SCRAPPING}" : ${scrappingResult.modifiedCount}/${scrappingCount} document(s) mis à jour`)
  }

  console.info(`Migration terminée : ${totalModified} document(s) modifié(s) au total`)
}

export const requireShutdown: boolean = false
