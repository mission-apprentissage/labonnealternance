import { ObjectId } from "mongodb"
import { EMAIL_LOG_TYPE } from "shared/models/applicant-email-log.model"
import { JOBPARTNERS_LABEL } from "shared/models/jobs-partners.model"
import { SEARCH_PAGE_PATH } from "shared/utils/search-url-compat"

import { logger } from "@/common/logger"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import { sentryCaptureException } from "@/common/utils/sentry-utils"
import config from "@/config"
import { getEmailTemplate, isEmailBlacklisted } from "@/services/application.service"
import { buildLbaUrlFromJob } from "@/services/jobs/job-opportunity/job-opportunity.service"
import mailer from "@/services/mailer.service"

import type { SuggestionsNafApplicantWithSuggestions, SuggestionsNafSuggestion, SuggestionsNafTargetWithSuggestions } from "./find-suggestions-naf-jobs"
import { MAX_DISTANCE_KM, MIN_SUGGESTIONS } from "./find-suggestions-naf-jobs"
import type { SuggestionsNafSourceJob } from "./find-suggestions-naf-targets"
import { getContractsYear } from "./find-suggestions-naf-targets"

// utm_campaign distingue les liens d'offres du lien vers la recherche.
const UTM_CAMPAIGNS = {
  offre: "2610_lba_candidats_suggestions-emploi-autres-naf-offre",
  recherche: "2610_lba_candidats_suggestions-emploi-autres-naf-recherche",
} as const

const imagePath = `${config.publicUrl}/images/emails/`

const withUtm = (url: string, link: keyof typeof UTM_CAMPAIGNS) => {
  const taggedUrl = new URL(url)
  taggedUrl.searchParams.set("utm_source", "lba-transactionnel")
  taggedUrl.searchParams.set("utm_medium", "email")
  taggedUrl.searchParams.set("utm_campaign", UTM_CAMPAIGNS[link])
  return taggedUrl.toString()
}

const getCompanyName = (job: Pick<SuggestionsNafSourceJob, "workplace_brand" | "workplace_name" | "workplace_legal_name">) =>
  job.workplace_brand || job.workplace_name || job.workplace_legal_name || "Entreprise"

// Rejoue « ce métier autour du lieu de la candidature », dans le même rayon que les suggestions.
const buildSearchUrl = ({ rome_libelle, source_job, source_geopoint }: SuggestionsNafTargetWithSuggestions) => {
  const searchUrl = new URL(`${config.publicUrl}${SEARCH_PAGE_PATH}`)
  searchUrl.searchParams.set("q", rome_libelle)
  if (source_job.workplace_address_city) {
    const [longitude, latitude] = source_geopoint.coordinates
    searchUrl.searchParams.set("lieu_label", source_job.workplace_address_city)
    searchUrl.searchParams.set("latitude", String(latitude))
    searchUrl.searchParams.set("longitude", String(longitude))
    searchUrl.searchParams.set("radius", String(MAX_DISTANCE_KM))
  }
  return withUtm(searchUrl.toString(), "recherche")
}

// La distance sert au tri mais n'est pas affichée : le candidat ignore qu'elle part du lieu de sa candidature.
const toEmailSuggestion = ({ sector, job }: SuggestionsNafSuggestion, contractsYear: number) => ({
  title: job.partner_label === JOBPARTNERS_LABEL.RECRUTEURS_LBA ? "Candidature spontanée" : job.offer_title,
  company: getCompanyName(job),
  city: job.workplace_address_city || job.workplace_address_label,
  sector: sector.naf_libelle,
  contracts: sector.contrats_par_annee.find(({ annee }) => annee === contractsYear)?.n_contrats ?? 0,
  url: withUtm(buildLbaUrlFromJob(job), "offre"),
})

export const buildSuggestionsNafEmail = (applicant: Pick<SuggestionsNafApplicantWithSuggestions, "firstname">, target: SuggestionsNafTargetWithSuggestions, now = new Date()) => {
  const contractsYear = getContractsYear(now)
  return {
    subject: `Votre métier ${target.rome_libelle} est recherché dans d'autres secteurs, tentez votre chance !`,
    data: {
      images: { logoLba: `${imagePath}logo_LBA.png`, logoRf: `${imagePath}logo_rf.png` },
      publicEmail: config.publicEmail,
      firstname: applicant.firstname,
      source: { title: target.source_job.offer_title, company: getCompanyName(target.source_job), sector: target.source_job.workplace_naf_label },
      contractsYear,
      suggestions: target.suggestions.map((suggestion) => toEmailSuggestion(suggestion, contractsYear)),
      searchUrl: buildSearchUrl(target),
    },
  }
}

// Tracé avant l'envoi : un arrêt du job juste après l'envoi ne doit pas permettre un second envoi au rejeu.
// Retiré en cas d'échec, mais un rejeu ne reprend que les candidats dont aucun envoi n'a abouti : un ROME en échec à côté
// d'un ROME envoyé est perdu (cf. findSuggestionsNafApplicants).
const sendTargetEmail = async (applicant: SuggestionsNafApplicantWithSuggestions, target: SuggestionsNafTargetWithSuggestions) => {
  const logId = new ObjectId()
  await getDbCollection("applicants_email_logs").insertOne({
    _id: logId,
    applicant_id: applicant._id,
    application_id: target.source_application_id,
    type: EMAIL_LOG_TYPE.SUGGESTIONS_NAF,
    message_id: null,
    createdAt: new Date(),
  })
  try {
    const { subject, data } = buildSuggestionsNafEmail(applicant, target)
    const { messageId } = await mailer.sendEmail({ to: applicant.email, subject, template: getEmailTemplate("mail-candidat-suggestions-naf"), data })
    await getDbCollection("applicants_email_logs").updateOne({ _id: logId }, { $set: { message_id: messageId } })
  } catch (err) {
    await getDbCollection("applicants_email_logs").deleteOne({ _id: logId })
    throw err
  }
}

export const sendSuggestionsNafEmails = async (applicants: SuggestionsNafApplicantWithSuggestions[]) => {
  const counters = { sent: 0, failed: 0, blacklisted: 0 }
  for (const applicant of applicants) {
    const targets = applicant.targets.filter(({ suggestions }) => suggestions.length >= MIN_SUGGESTIONS)
    if (!targets.length) continue
    if (await isEmailBlacklisted(applicant.email)) {
      counters.blacklisted++
      continue
    }
    for (const target of targets) {
      try {
        await sendTargetEmail(applicant, target)
        counters.sent++
      } catch (err) {
        counters.failed++
        // Message, `rejected` et `envelope` d'une erreur nodemailer portent l'adresse du candidat, que le logger ne masque pas.
        const { code, responseCode } = (err ?? {}) as { code?: string; responseCode?: number }
        logger.error({ applicant_id: applicant._id.toString(), rome: target.rome, code, responseCode }, "sendSuggestionsNafEmails: échec de l'envoi")
        sentryCaptureException(err)
      }
    }
  }
  return counters
}
