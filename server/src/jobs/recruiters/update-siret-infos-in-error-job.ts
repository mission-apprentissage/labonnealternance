import { internal } from "@hapi/boom"
import type { IBusinessError, IEntreprise, IEntrepriseManagedByCfa, IRoleManagement, IUserWithAccount } from "shared"
import { JOB_STATUS_ENGLISH } from "shared"
import { BusinessErrorCodes } from "shared/constants/error-codes"
import { CFA, ENTREPRISE } from "shared/constants/recruteur"
import type { ICFA } from "shared/models/cfa.model"
import { EntrepriseStatus } from "shared/models/entreprise.model"
import { JOBPARTNERS_LABEL } from "shared/models/jobs-partners.model"
import { AccessStatus } from "shared/models/role-management.model"
import { getLastStatusEvent, getSortedStatusEvents } from "shared/utils/get-last-status-event"
import { isTrainingOrganizationNafCode } from "shared/utils/naf-utils"
import { logger } from "@/common/logger"
import { asyncForEach } from "@/common/utils/async-utils"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import { sentryCaptureException } from "@/common/utils/sentry-utils"
import { formatSlackTable, notifyToSlack } from "@/common/utils/slack-utils"
import { getEntrepriseDataFromSiret } from "@/services/etablissement.service"
import { archiveFormulaire } from "@/services/formulaire.service"
import { sendMailNouvelleOffre } from "@/services/formulaire-notifications.service"
import { buildJobStatusChangeUpdate, changeJobsPartnersStatus } from "@/services/job-partner-status.service"
import { upsertEntrepriseData } from "@/services/organization.service"
import { sendDeactivatedRecruteurMail } from "@/services/role-management.service"
import { setEntrepriseInError } from "@/services/user-recruteur.service"

const DAY_MS = 24 * 60 * 60 * 1000
export const STALE_ERROR_DAYS = 7
export const MAX_DETAILED_ROWS = 20
// Avec MAX_DETAILED_ROWS, borne le rapport sous SLACK_MESSAGE_MAX_LENGTH : un seul message par passe.
const MAX_REASON_LENGTH = 60
const PENDING_STATUSES: EntrepriseStatus[] = [EntrepriseStatus.ERROR, EntrepriseStatus.A_METTRE_A_JOUR]

// Le rapport Slack n'identifie une entreprise que par son SIRET : la raison sociale d'une entreprise individuelle est le nom d'une personne.
type SiretIssue = { siret: string; cfaSiret?: string; reason: string; since: Date | null }

/** Date du plus ancien événement de la série d'échecs en cours : un historique peut porter un événement ERROR par nuit. */
export const getErrorStreakStart = (status: IEntreprise["status"]): Date | null => {
  let start: Date | null = null
  for (const event of getSortedStatusEvents(status).reverse()) {
    if (!PENDING_STATUSES.includes(event.status)) break
    start = new Date(event.date)
  }
  return start
}

const getErrorMessage = (err: unknown): string => `${(err && typeof err === "object" && "message" in err && err.message) || err}`

// Les accents graves fermeraient le bloc de code du tableau.
const formatReason = (reason: string) => {
  const flat = reason.replace(/[\s`]+/g, " ").trim()
  return flat.length > MAX_REASON_LENGTH ? `${flat.slice(0, MAX_REASON_LENGTH)}…` : flat
}

const formatIssueLines = ({ failures, deactivations, now }: { failures: SiretIssue[]; deactivations: SiretIssue[]; now: Date }): string[] => {
  const ageInMs = ({ since }: SiretIssue) => (since ? now.getTime() - since.getTime() : 0)
  const oldestFirst = (issues: SiretIssue[]) => [...issues].sort((a, b) => ageInMs(b) - ageInMs(a))
  const isStale = (issue: SiretIssue) => ageInMs(issue) > STALE_ERROR_DAYS * DAY_MS
  const withCfa = [...failures, ...deactivations].some(({ cfaSiret }) => cfaSiret)
  const header = ["SIRET", ...(withCfa ? ["SIRET CFA"] : []), "Depuis", "Jours", "Motif"]
  const toRow = (issue: SiretIssue) => [
    issue.siret,
    ...(withCfa ? [issue.cfaSiret ?? ""] : []),
    issue.since ? issue.since.toISOString().slice(0, 10) : "?",
    issue.since ? `${Math.floor(ageInMs(issue) / DAY_MS)}` : "?",
    formatReason(issue.reason),
  ]
  const sections = [
    { title: `:rotating_light: En échec depuis plus de ${STALE_ERROR_DAYS} jours`, issues: oldestFirst(failures.filter(isStale)) },
    { title: "Échecs récents", issues: oldestFirst(failures.filter((issue) => !isStale(issue))) },
    { title: "Désactivations", issues: oldestFirst(deactivations) },
  ]
  const lines: string[] = []
  let remainingRows = MAX_DETAILED_ROWS
  for (const { title, issues } of sections) {
    if (!issues.length) continue
    const shown = issues.slice(0, remainingRows)
    remainingRows -= shown.length
    lines.push(`${title} — ${issues.length} entreprise${issues.length > 1 ? "s" : ""} :`)
    if (shown.length) lines.push(...formatSlackTable(header, shown.map(toRow)))
    if (issues.length > shown.length) lines.push(`… et ${issues.length - shown.length} autre${issues.length - shown.length > 1 ? "s" : ""}`)
  }
  return lines
}

const notifyReport = async (subject: string, lines: string[], error: boolean) => notifyToSlack({ subject, message: lines.join("\n"), error })

/** Motif court d'un refus : le message d'une erreur métier peut être du HTML destiné à l'UI. */
const getRefusalReason = (error: IBusinessError): string => {
  if (error.errorCode === BusinessErrorCodes.NON_DIFFUSIBLE) return "informations de l’entreprise non diffusibles"
  if (error.errorCode === BusinessErrorCodes.IS_CFA) return "entreprise rattachée à un code NAF 85"
  return error.message
}

const updateEntreprisesInfosInError = async () => {
  const entreprises = await getDbCollection("entreprises")
    .find({ $expr: { $in: [{ $arrayElemAt: ["$status.status", -1] }, PENDING_STATUSES] } })
    .toArray()
  const stats = { success: 0, failure: 0, deactivated: 0 }
  const failures: SiretIssue[] = []
  const deactivations: SiretIssue[] = []
  logger.info(`Correction des entreprises en erreur: ${entreprises.length} entreprises à mettre à jour...`)
  await asyncForEach(entreprises, async (entreprise) => {
    const { siret, _id } = entreprise
    try {
      if (!siret) {
        throw internal("unexpected: no siret for entreprise", { id: entreprise._id })
      }
      const siretResponse = await getEntrepriseDataFromSiret({ siret, type: ENTREPRISE })
      await upsertEntrepriseData(siret, "script de reprise de données entreprise", siretResponse, false)
      if ("error" in siretResponse) {
        deactivations.push({ siret, reason: getRefusalReason(siretResponse), since: getErrorStreakStart(entreprise.status) })
        stats.deactivated++
      } else {
        stats.success++
      }
    } catch (err) {
      const errorMessage = getErrorMessage(err)
      logger.error(err)
      logger.error(`Correction des entreprises en erreur: entreprise id=${_id}, erreur: ${errorMessage}`)
      sentryCaptureException(err)
      if (getLastStatusEvent(entreprise.status)?.status === EntrepriseStatus.ERROR) {
        await setEntrepriseInError(entreprise._id, errorMessage)
      }
      failures.push({ siret: siret || "(absent)", reason: errorMessage, since: getErrorStreakStart(entreprise.status) })
      stats.failure++
    }
  })
  await notifyReport(
    "Reprise des entreprises en erreur API SIRET",
    [
      `${stats.success} entreprises reprises avec succès. ${stats.failure} entreprises en échec. ${stats.deactivated} entreprises désactivées pour non-respect des règles de création.`,
      ...formatIssueLines({ failures, deactivations, now: new Date() }),
    ],
    stats.failure > 0
  )
  return stats
}

const NAF_85_REFUSAL: IBusinessError = { error: true, message: "L'entreprise partenaire ne doit pas relever du secteur de l'enseignement.", errorCode: BusinessErrorCodes.IS_CFA }

const deactivationWarningOriginExclusion = ["OPCOEP", "opcoep-HUBE", "opcoep-CRM"]

export const warnDeactivatedRecruteur = async (user: IUserWithAccount, entreprise: IEntreprise, error: IBusinessError) => {
  if (!deactivationWarningOriginExclusion.includes(user.origin ?? "")) {
    const errorMessage = getRefusalReason(error)
    const { last_name, first_name, email, phone } = user
    const { siret, raison_sociale } = entreprise

    await sendDeactivatedRecruteurMail({ email, last_name, first_name, establishment_siret: siret, establishment_raison_sociale: raison_sociale, phone, errorMessage })
  }
}

const updateRecruteursSiretInfosInError = async () => {
  let entreprisesManagedByCfa = (await getDbCollection("entreprise_managed_by_cfa")
    .aggregate([
      {
        $lookup: {
          from: "entreprises",
          localField: "entreprise_id",
          foreignField: "_id",
          as: "entreprise",
        },
      },
      {
        $unwind: "$entreprise",
      },
      {
        $match: {
          "entreprise.status.status": EntrepriseStatus.ERROR,
        },
      },
      {
        $lookup: {
          from: "cfas",
          localField: "cfa_id",
          foreignField: "_id",
          as: "cfa",
        },
      },
      {
        $unwind: "$cfa",
      },
      {
        $addFields: {
          cfa_id_string: { $convert: { input: "$cfa_id", to: "string" } },
        },
      },
      {
        $lookup: {
          from: "rolemanagements",
          localField: "cfa_id_string",
          foreignField: "authorized_id",
          as: "role",
        },
      },
      {
        $unwind: "$role",
      },
      {
        $lookup: {
          from: "userswithaccounts",
          localField: "role.user_id",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $unwind: "$user",
      },
    ])
    .toArray()) as (IEntrepriseManagedByCfa & { entreprise: IEntreprise; cfa: ICFA; role: IRoleManagement; user: IUserWithAccount })[]

  entreprisesManagedByCfa = entreprisesManagedByCfa.filter(({ entreprise }) => getLastStatusEvent(entreprise.status)?.status === EntrepriseStatus.ERROR)

  const stats = { success: 0, failure: 0, deactivated: 0 }
  // Une ligne par utilisateur du CFA : le rapport n'en garde qu'une par couple entreprise / CFA.
  const failures = new Map<string, SiretIssue>()
  const deactivations = new Map<string, SiretIssue>()
  logger.info(`Correction des entreprises en erreur: ${entreprisesManagedByCfa.length} à mettre à jour...`)
  await asyncForEach(entreprisesManagedByCfa, async (entrepriseManagedByCfa) => {
    const { entreprise, cfa, user, role } = entrepriseManagedByCfa
    const { siret } = entreprise
    const issueKey = `${siret}-${cfa.siret}`
    const toIssue = (reason: string): SiretIssue => ({ siret, cfaSiret: cfa.siret, reason, since: getErrorStreakStart(entreprise.status) })
    try {
      const siretResponse = await getEntrepriseDataFromSiret({ siret, type: CFA })
      // Le type CFA dispense getEntrepriseDataFromSiret du contrôle NAF 85, que updateEntreprisesInfosInError applique ensuite.
      const refusal = "error" in siretResponse ? siretResponse : isTrainingOrganizationNafCode(siretResponse.naf_code) ? NAF_85_REFUSAL : null
      if (refusal) {
        logger.warn(`Correction des recruteurs en erreur: role id=${entrepriseManagedByCfa._id}, désactivation car création interdite, raison=${refusal.message}`)
        await archiveFormulaire(user._id, siret)
        // Une ligne par rôle du CFA, quel que soit son statut : seul un accès accordé est prévenu.
        if (getLastStatusEvent(role.status)?.status === AccessStatus.GRANTED) {
          await warnDeactivatedRecruteur(user, entreprise, refusal)
        }
        deactivations.set(issueKey, toIssue(getRefusalReason(refusal)))
        stats.deactivated++
      } else if (!("error" in siretResponse)) {
        await upsertEntrepriseData(siret, "script de reprise de données entreprise", siretResponse, false)

        if (getLastStatusEvent(role.status)?.status === AccessStatus.GRANTED) {
          const awaitingOffer = await getDbCollection("jobs_partners").findOne({
            offer_status: JOB_STATUS_ENGLISH.EN_ATTENTE,
            workplace_siret: siret,
            partner_label: JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA,
            managed_by: role.user_id,
          })
          if (awaitingOffer) {
            await getDbCollection("jobs_partners").updateOne(
              { _id: awaitingOffer._id },
              buildJobStatusChangeUpdate({
                status: JOB_STATUS_ENGLISH.ACTIVE,
                reason: "données entreprise corrigées",
                grantedBy: "update-siret-infos-in-error-job",
              })
            )
            // L'envoi est isolé du try englobant : une panne d'envoi faisait retomber dans le catch,
            // qui dépubliait l'offre tout juste republiée sous le motif "vérification du SIRET en
            // erreur" — alors que le SIRET venait précisément d'être revalidé.
            try {
              await sendMailNouvelleOffre(user, awaitingOffer)
            } catch (mailErr) {
              logger.error(mailErr)
              logger.error(`Correction des recruteurs en erreur: offre id=${awaitingOffer._id}, mail de republication non envoyé`)
              sentryCaptureException(mailErr)
            }
          }
        }
        stats.success++
      }
    } catch (err) {
      const errorMessage = getErrorMessage(err)
      // Restreint aux offres publiées : dépublier le temps de résoudre l'erreur SIRET est bien
      // l'intention, mais le filtre portait sur tout le périmètre du recruteur et rouvrait des
      // offres closes — une annulation ou un recrutement réussi repassait "en attente" (issue #5429).
      // Une offre déjà en attente est exclue au passage : l'y remettre ne changerait rien et
      // ajouterait une transition fictive à son historique.
      await changeJobsPartnersStatus(
        {
          workplace_siret: siret,
          partner_label: JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA,
          managed_by: role.user_id,
          offer_status: JOB_STATUS_ENGLISH.ACTIVE,
        },
        {
          status: JOB_STATUS_ENGLISH.EN_ATTENTE,
          reason: "vérification du SIRET en erreur",
          grantedBy: "update-siret-infos-in-error-job",
        }
      )
      logger.error(err)
      logger.error(`Correction des recruteurs en erreur: role id=${entrepriseManagedByCfa._id}, erreur: ${errorMessage}`)
      sentryCaptureException(err)
      failures.set(issueKey, toIssue(errorMessage))
      stats.failure++
    }
  })
  await notifyReport(
    "Reprise des recruteurs en erreur API SIRET",
    [
      `${stats.success} recruteurs repris avec succès. ${stats.failure} recruteurs en échec. ${stats.deactivated} recruteurs désactivés pour non-respect des règles de création.`,
      ...formatIssueLines({ failures: [...failures.values()], deactivations: [...deactivations.values()], now: new Date() }),
    ],
    stats.failure > 0
  )
  return stats
}

export const updateSiretInfosInError = async () => {
  // Les recruteurs d'abord : updateEntreprisesInfosInError désactive une entreprise refusée, que
  // updateRecruteursSiretInfosInError ne sélectionnerait alors plus pour archiver son formulaire et prévenir le CFA.
  const recruteurResult = await updateRecruteursSiretInfosInError()
  const userRecruteurResult = await updateEntreprisesInfosInError()
  return { userRecruteurResult, recruteurResult }
}
