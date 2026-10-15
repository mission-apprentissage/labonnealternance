import { ObjectId } from "mongodb"
import { EMAIL_LOG_TYPE } from "shared/models/applicant-email-log.model"
import { JOBPARTNERS_LABEL } from "shared/models/jobs-partners.model"

import { logger } from "@/common/logger"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import { sentryCaptureException } from "@/common/utils/sentry-utils"
import config from "@/config"
import { getEmailTemplate, isEmailBlacklisted } from "@/services/application.service"
import { buildLbaUrlFromJob } from "@/services/jobs/job-opportunity/job-opportunity.service"
import mailer from "@/services/mailer.service"

import type { SuggestionsNafApplicantWithSuggestions, SuggestionsNafSuggestion, SuggestionsNafTargetWithSuggestions } from "./find-suggestions-naf-jobs"
import { MIN_SUGGESTIONS } from "./find-suggestions-naf-jobs"

// RG 8 de #5440. utm_content distingue les liens d'offres du lien vers la recherche.
const UTM_PARAMS = { utm_source: "lba-transactionnel", utm_medium: "email", utm_campaign: "2610_lba_candidats_suggestions-naf-recherche-emplois" }

const imagePath = `${config.publicUrl}/images/emails/`

const withUtm = (url: string, utmContent: string) => {
  const taggedUrl = new URL(url)
  for (const [key, value] of Object.entries(UTM_PARAMS)) taggedUrl.searchParams.set(key, value)
  taggedUrl.searchParams.set("utm_content", utmContent)
  return taggedUrl.toString()
}

// La distance sert au tri mais n'est pas affichée : le candidat ignore qu'elle part du lieu de sa candidature.
const toEmailSuggestion = ({ sector, job }: SuggestionsNafSuggestion) => {
  const contracts = sector.contrats_par_annee.reduce((total, { n_contrats }) => total + n_contrats, 0)
  return {
    sector: sector.naf_libelle,
    title: job.partner_label === JOBPARTNERS_LABEL.RECRUTEURS_LBA ? "Candidature spontanée" : job.offer_title,
    company: job.workplace_brand || job.workplace_name || job.workplace_legal_name || "Entreprise",
    city: job.workplace_address_city || job.workplace_address_label,
    contracts,
    contractsSince: contracts ? Math.min(...sector.contrats_par_annee.map(({ annee }) => annee)) : null,
    url: withUtm(buildLbaUrlFromJob(job), "offre"),
  }
}

export const buildSuggestionsNafEmail = (applicant: Pick<SuggestionsNafApplicantWithSuggestions, "firstname" | "lastname">, target: SuggestionsNafTargetWithSuggestions) => ({
  subject: `Votre métier ${target.rome_libelle} est recherché dans d'autres secteurs, tentez votre chance !`,
  data: {
    images: { logoLba: `${imagePath}logo_LBA.png`, logoRf: `${imagePath}logo_rf.png` },
    publicEmail: config.publicEmail,
    firstname: applicant.firstname,
    lastname: applicant.lastname,
    rome_libelle: target.rome_libelle,
    suggestions: target.suggestions.map(toEmailSuggestion),
    searchUrl: withUtm(`${config.publicUrl}/recherche`, "recherche"),
  },
})

// Tracé avant l'envoi : un arrêt du job juste après l'envoi ne doit pas permettre un second envoi au rejeu.
// Retiré en cas d'échec pour qu'un rejeu manuel puisse renvoyer l'email (cf. findSuggestionsNafApplicants).
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
        logger.error({ err, applicant_id: applicant._id.toString(), rome: target.rome }, "sendSuggestionsNafEmails: échec de l'envoi")
        sentryCaptureException(err)
      }
    }
  }
  return counters
}
