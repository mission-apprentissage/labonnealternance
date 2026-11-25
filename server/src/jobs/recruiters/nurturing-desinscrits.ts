import { UNSUBSCRIBE_REASONS } from "shared/constants/unsubscribe"
import dayjs from "shared/helpers/dayjs"

import { logger } from "@/common/logger"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import { notifyToSlack } from "@/common/utils/slack-utils"
import config from "@/config"
import { uploadContactListToBrevo } from "@/services/brevo.service"

const TIMEZONE = "Europe/Paris"
// Relance 9 mois après la désinscription : l'entreprise a encore 3 mois devant elle avant le renouvellement
// du contrat de ses apprentis, et avant de re-planifier son recrutement.
const NURTURING_MONTHS = 9
// Les déclenchements tombant en août (mois creux) sont reportés au 1er septembre
const AUGUST = 7
const SEPTEMBER = 8
const AUGUST_CATCH_UP_DAYS = 31

type NurturingRow = {
  email: string
  raison_sociale: string
  date_desinscription: Date
}

export const nurturingDesinscrits = async () => {
  const listId = config.brevo.listIds.nurturingDesinscrits
  if (!listId) {
    logger.warn("nurturingDesinscrits: LBA_BREVO_NURTURING_DESINSCRITS_LIST_ID non configuré, job ignoré")
    return
  }

  const today = dayjs().tz(TIMEZONE).startOf("day")
  if (today.month() === AUGUST) {
    logger.info("nurturingDesinscrits: mois d'août, relances reportées au 1er septembre")
    return
  }

  let windowStart = today.subtract(NURTURING_MONTHS, "month")
  const windowEnd = windowStart.add(1, "day")
  if (today.month() === SEPTEMBER && today.date() === 1) {
    windowStart = windowStart.subtract(AUGUST_CATCH_UP_DAYS, "day")
  }

  const now = new Date()

  const candidates = await getDbCollection("unsubscribedrecruteurslba")
    .find({
      unsubscribe_reason: UNSUBSCRIBE_REASONS.DEJA_TROUVE,
      email: { $nin: [null, ""] },
      relance_nurturing_date: null,
      unsubscribe_date: { $gte: windowStart.toDate(), $lt: windowEnd.toDate() },
    })
    .sort({ unsubscribe_date: 1 })
    .toArray()

  if (candidates.length === 0) {
    logger.info("nurturingDesinscrits: aucune entreprise à relancer")
    return
  }

  const candidateEmails = [...new Set(candidates.map((company) => company.email!.toLowerCase()))]
  const emailsToCheck = [...new Set([...candidateEmails, ...candidates.map((company) => company.email!)])]
  const blacklisted = new Set(
    (
      await getDbCollection("emailblacklists")
        .find({ email: { $in: emailsToCheck } })
        .toArray()
    ).map(({ email }) => email.toLowerCase())
  )

  // Une adresse rattachée à plusieurs établissements désinscrits ne reçoit qu'un seul mail
  const rowsByEmail = new Map<string, NurturingRow>()
  for (const company of candidates) {
    const email = company.email!.toLowerCase()
    if (blacklisted.has(email) || rowsByEmail.has(email)) continue
    rowsByEmail.set(email, {
      email,
      raison_sociale: company.raison_sociale || company.enseigne || "",
      date_desinscription: company.unsubscribe_date,
    })
  }
  const rows = [...rowsByEmail.values()]

  if (rows.length === 0) {
    logger.info("nurturingDesinscrits: toutes les adresses sont blacklistées, aucune relance")
    return
  }

  // Marquage AVANT l'envoi : en cas de crash entre les deux, on préfère rater une relance plutôt que d'en envoyer deux.
  // Il couvre tous les établissements de l'adresse, y compris ceux dont l'anniversaire tombe un autre jour.
  const emailsToMark = candidates.map((company) => company.email!).filter((email) => rowsByEmail.has(email.toLowerCase()))
  await getDbCollection("unsubscribedrecruteurslba").updateMany(
    { unsubscribe_reason: UNSUBSCRIBE_REASONS.DEJA_TROUVE, email: { $in: emailsToMark } },
    { $set: { relance_nurturing_date: now } }
  )

  try {
    await uploadContactListToBrevo(
      rows,
      [
        { key: "email", header: "EMAIL" },
        { key: "raison_sociale", header: "RAISON_SOCIALE" },
        { key: "date_desinscription", header: "DATE_DESINSCRIPTION" },
      ],
      listId
    )
  } catch (error) {
    // L'e-mail est conservé : il permet une relance manuelle depuis un export.
    await notifyToSlack({
      subject: "NURTURING DESINSCRITS",
      message: `Échec de l'envoi vers Brevo pour ${rows.length} entreprise(s) (déjà tracées, elles ne seront pas relancées)`,
      error: true,
    })
    throw error
  }

  // Minimisation des données : l'adresse n'est plus utile une fois la relance poussée.
  await getDbCollection("unsubscribedrecruteurslba").updateMany({ email: { $in: emailsToMark } }, { $set: { email: null } })

  await notifyToSlack({ subject: "NURTURING DESINSCRITS", message: `${rows.length} entreprise(s) désinscrite(s) poussée(s) vers la liste Brevo de nurturing`, error: false })
  logger.info(`nurturingDesinscrits: ${rows.length} entreprise(s) relancée(s)`)
}
