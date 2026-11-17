import { conflict, forbidden, notFound } from "@hapi/boom"
import { stringify } from "csv-stringify/sync"
import type { ObjectId } from "mongodb"
import { parseEnum, type zRoutes } from "shared"
import { APPLICATION_TREATED_ELSEWHERE, ApplicationIntention } from "shared/constants/application"
import dayjs from "shared/helpers/dayjs"
import { ApplicationScanStatus } from "shared/models/applications.model"
import type { ComputedUserAccess, IApplicant, IApplication } from "shared/models/index"
import type { IJobsPartnersOfferPrivate } from "shared/models/jobs-partners.model"
import { JOBPARTNERS_LABEL } from "shared/models/jobs-partners.model"
import { getApplicationsConsultation, getOfferClosure } from "shared/utils/applications-consultation"
import { getApplicationsExportFileName } from "shared/utils/applications-export"
import { decodeSanitizedText } from "shared/utils/string-utils"
import type { z } from "zod"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import { canAccessJobAsEntrepriseOrCfa } from "@/security/authorisation.service"
import { generateApplicationReplyToken } from "@/services/app-links.service"
import {
  buildRecruiterIntentionEmailSubject,
  buildUserForToken,
  getApplicationAttachmentFile,
  getApplicationAttachmentSize,
  getApplicationPartnerName,
  getUserManagingOffer,
} from "@/services/application.service"

type IJobApplicationsResponse = z.output<(typeof zRoutes)["get"]["/application/job/:jobId"]["response"]["200"]>

const isConsultable = (job: IJobsPartnersOfferPrivate) => getApplicationsConsultation({ expiration: job.offer_expiration, closure: getOfferClosure(job) }).status !== "unavailable"

const getManagedJob = async (jobId: ObjectId, userAccess: ComputedUserAccess | undefined): Promise<IJobsPartnersOfferPrivate> => {
  const job = await getDbCollection("jobs_partners").findOne({ _id: jobId, partner_label: JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA })
  if (!job) {
    throw notFound("Offre introuvable")
  }
  // La route contrôle déjà l'accès à l'offre ; ce contrôle-ci écarte en plus le rattachement OPCO.
  if (!(await canAccessJobAsEntrepriseOrCfa(userAccess, job))) {
    throw forbidden("Accès réservé au recruteur de l'offre")
  }
  return job
}

const getConsultableJob = async (jobId: ObjectId, userAccess: ComputedUserAccess | undefined): Promise<IJobsPartnersOfferPrivate> => {
  const job = await getManagedJob(jobId, userAccess)
  if (!isConsultable(job)) {
    throw forbidden("Les candidatures de cette offre ne sont plus consultables")
  }
  return job
}

// $unwind écarte les candidatures dont le candidat a été anonymisé : il n'y a plus rien à afficher.
type IApplicationWithApplicant = IApplication & { applicant: Pick<IApplicant, "firstname" | "lastname" | "email" | "phone"> }

const getApplicationsWithApplicant = (jobId: ObjectId, applicantFields: Partial<Record<keyof IApplicant, 1>>, applicationId?: ObjectId) =>
  getDbCollection("applications")
    .aggregate<IApplicationWithApplicant>([
      { $match: { job_id: jobId, ...(applicationId ? { _id: applicationId } : {}) } },
      { $lookup: { from: "applicants", localField: "applicant_id", foreignField: "_id", pipeline: [{ $project: applicantFields }], as: "applicant" } },
      { $unwind: "$applicant" },
      { $sort: { created_at: -1 } },
    ])
    .toArray()

/**
 * Candidatures d'une offre LBA pour son recruteur ou le CFA qui la gère (#5769). Passé le délai de consultation,
 * l'offre est renvoyée sans ses candidatures : la page explique pourquoi elles ne sont plus disponibles.
 */
export const getJobApplicationsForRecruiter = async (jobId: ObjectId, userAccess: ComputedUserAccess | undefined): Promise<IJobApplicationsResponse> => {
  const job = await getManagedJob(jobId, userAccess)
  const applications = isConsultable(job) ? await getApplicationsWithApplicant(jobId, { firstname: 1, lastname: 1 }) : []

  return {
    job: {
      _id: job._id,
      offer_title: job.offer_title,
      offer_rome_appellation: job.offer_rome_appellation ?? null,
      offer_expiration: job.offer_expiration ?? null,
      offer_status: job.offer_status,
      closure: getOfferClosure(job),
    },
    applications: applications.map(({ _id, applicant, company_recruitment_intention, created_at }) => ({
      _id,
      applicant_first_name: applicant.firstname,
      applicant_last_name: applicant.lastname,
      company_recruitment_intention: company_recruitment_intention ?? null,
      created_at: created_at ?? null,
    })),
  }
}

const formatDate = (date: Date | null | undefined) => (date ? dayjs(date).tz("Europe/Paris").format("DD/MM/YYYY") : "")
const formatText = (text: string | null | undefined) => (text ? decodeSanitizedText(text).trim() : "")
const formatBoolean = (value: boolean | null | undefined) => (value === true ? "Oui" : value === false ? "Non" : "")

// Libellés de la page des candidatures (cf. getApplicationStatus), en précisant le traitement hors LBA.
const formatStatus = (intention: string | null | undefined) => {
  if (!intention) return "En attente"
  if (intention === ApplicationIntention.REFUS) return "Refusé"
  if (intention === APPLICATION_TREATED_ELSEWHERE) return "Contacté par un autre canal"
  return "Contacté"
}

// Informations non techniques d'une candidature, dans l'ordre de l'export et de la page de détail.
const APPLICATION_FIELDS: { key: string; label: string; value: (application: IApplicationWithApplicant) => string }[] = [
  { key: "firstname", label: "Prénom", value: ({ applicant }) => applicant.firstname },
  { key: "lastname", label: "Nom", value: ({ applicant }) => applicant.lastname.toUpperCase() },
  { key: "email", label: "E-mail", value: ({ applicant }) => applicant.email },
  { key: "phone", label: "Téléphone", value: ({ applicant }) => applicant.phone ?? "" },
  { key: "created_at", label: "Date de candidature", value: (application) => formatDate(application.created_at) },
  { key: "status", label: "Statut", value: (application) => formatStatus(application.company_recruitment_intention) },
  { key: "feedback_date", label: "Date de la réponse", value: (application) => formatDate(application.company_feedback_date ?? application.company_recruitment_intention_date) },
  { key: "feedback", label: "Réponse du recruteur", value: (application) => formatText(application.company_feedback) },
  { key: "feedback_reasons", label: "Motifs de refus", value: (application) => (application.company_feedback_reasons ?? []).join(", ") },
  { key: "message", label: "Message du candidat", value: (application) => formatText(application.applicant_message_to_company) },
  { key: "attachment", label: "Pièce jointe", value: (application) => application.applicant_attachment_name },
  { key: "attachment_deleted_at", label: "Pièce jointe supprimée le", value: (application) => formatDate(application.applicant_attachment_deleted_at) },
  { key: "inscription_formation", label: "Inscrit en formation", value: (application) => formatBoolean(application.applicant_inscription_formation) },
  { key: "formation", label: "Formation suivie", value: (application) => formatText(application.applicant_formation_description) },
  { key: "rythm", label: "Rythme de la formation", value: (application) => formatText(application.applicant_rythm_description) },
  { key: "contract_duration", label: "Durée de contrat souhaitée", value: (application) => formatText(application.applicant_contract_duration) },
  { key: "contract_start", label: "Début de contrat souhaité", value: (application) => (application.applicant_contract_start ?? []).join(", ") },
  { key: "job_searched", label: "Métier recherché", value: (application) => formatText(application.job_searched_by_user) },
]

const getAnswers = (application: IApplicationWithApplicant) =>
  new Map((application.applicant_answers_to_recruiter_questions ?? []).map(({ question, answer }) => [formatText(question), formatText(answer)]))

/**
 * Récapitulatif des candidatures d'une offre, en CSV séparé par des tabulations (#5769).
 * Seul le nom de la pièce jointe figure dans le fichier, jamais son contenu.
 */
export const exportJobApplicationsForRecruiter = async (jobId: ObjectId, userAccess: ComputedUserAccess | undefined): Promise<{ fileName: string; content: string }> => {
  const job = await getConsultableJob(jobId, userAccess)
  const applications = await getApplicationsWithApplicant(jobId, { firstname: 1, lastname: 1, email: 1, phone: 1 })

  // Une colonne par question posée, dans l'ordre où elles apparaissent.
  const questions = [...new Set(applications.flatMap((application) => [...getAnswers(application).keys()]))]
  const columns = [...APPLICATION_FIELDS.map(({ label }) => label), ...questions]

  const rows = applications.map((application) => {
    const answers = getAnswers(application)
    return [
      ...APPLICATION_FIELDS.map(({ key, value }) => {
        const text = value(application)
        // Apostrophe comme dans l'export des OPCO : sans elle, le tableur lit un nombre et retire le 0 initial.
        return key === "phone" && text ? `'${text}` : text
      }),
      ...questions.map((question) => answers.get(question) ?? ""),
    ]
  })

  // BOM : Excel lit sinon le fichier en Windows-1252. escape_formulas neutralise les textes saisis par le
  // candidat qui commenceraient par = + - @ (injection de formule à l'ouverture dans un tableur).
  const content = stringify([columns, ...rows], { delimiter: "\t", bom: true, escape_formulas: true })
  return { fileName: getApplicationsExportFileName(job.offer_title), content }
}

type IJobApplicationDetailResponse = z.output<(typeof zRoutes)["get"]["/application/job/:jobId/application/:applicationId"]["response"]["200"]>

const nullableText = (text: string | null | undefined) => formatText(text) || null

/** Détail d'une candidature pour le recruteur ou le CFA de l'offre (#5769). */
export const getJobApplicationDetailForRecruiter = async (
  jobId: ObjectId,
  applicationId: ObjectId,
  userAccess: ComputedUserAccess | undefined
): Promise<IJobApplicationDetailResponse> => {
  const job = await getConsultableJob(jobId, userAccess)
  // Le filtre sur job_id empêche de lire, via une offre accessible, une candidature d'une autre offre.
  const [application] = await getApplicationsWithApplicant(jobId, { firstname: 1, lastname: 1, email: 1, phone: 1 }, applicationId)
  if (!application) {
    throw notFound("Candidature introuvable")
  }
  const partner = getApplicationPartnerName(application.caller)
  const intention = parseEnum(ApplicationIntention, application.company_recruitment_intention)

  return {
    job: { _id: job._id, offer_title: job.offer_title, to_applicant_questions: job.to_applicant_questions ?? [] },
    application: {
      _id: application._id,
      created_at: application.created_at ?? null,
      applicant_first_name: application.applicant.firstname,
      applicant_last_name: application.applicant.lastname,
      applicant_email: application.applicant.email,
      applicant_phone: application.applicant.phone ?? "",
      company_recruitment_intention: application.company_recruitment_intention ?? null,
      company_recruitment_intention_date: application.company_recruitment_intention_date ?? null,
      company_feedback: nullableText(application.company_feedback),
      company_feedback_reasons: application.company_feedback_reasons ?? [],
      company_feedback_date: application.company_feedback_date ?? null,
      company_feedback_send_status: application.company_feedback_send_status ?? null,
      feedback_email_subject: intention
        ? buildRecruiterIntentionEmailSubject({ intention, companyName: application.company_name, partner, applicant: application.applicant })
        : null,
      applicant_message_to_company: nullableText(application.applicant_message_to_company),
      applicant_attachment_name: application.applicant_attachment_name,
      applicant_attachment_deleted_at: application.applicant_attachment_deleted_at ?? null,
      applicant_attachment_size: application.applicant_attachment_deleted_at ? null : await getApplicationAttachmentSize(application),
      applicant_inscription_formation: application.applicant_inscription_formation ?? null,
      applicant_contract_duration: nullableText(application.applicant_contract_duration),
      applicant_contract_start: application.applicant_contract_start ?? [],
      applicant_formation_description: nullableText(application.applicant_formation_description),
      applicant_rythm_description: nullableText(application.applicant_rythm_description),
      applicant_answers_to_recruiter_questions: [...getAnswers(application)].map(([question, answer]) => ({ question, answer })),
      partner_name: partner,
    },
  }
}

/** Pièce jointe d'une candidature pour le recruteur ou le CFA de l'offre (#5769), servie une fois l'antivirus passé. */
export const getJobApplicationAttachmentForRecruiter = async (
  jobId: ObjectId,
  applicationId: ObjectId,
  userAccess: ComputedUserAccess | undefined
): Promise<{ fileName: string; contentType: string; content: Buffer }> => {
  await getConsultableJob(jobId, userAccess)
  const [application] = await getApplicationsWithApplicant(jobId, { _id: 1 }, applicationId)
  if (!application) {
    throw notFound("Candidature introuvable")
  }
  if (application.applicant_attachment_deleted_at) {
    throw notFound("La pièce jointe de cette candidature a été supprimée")
  }
  if (application.scan_status !== ApplicationScanStatus.NO_VIRUS_DETECTED) {
    throw forbidden("La pièce jointe de cette candidature n'a pas été validée par l'antivirus")
  }
  const { contentType, content } = await getApplicationAttachmentFile(application)
  return { fileName: application.applicant_attachment_name, contentType, content }
}

/**
 * Le recruteur indique avoir répondu au candidat hors de LBA (#5769) : statut posé sans mail au candidat.
 * Réservé aux candidatures sans réponse, le filtre sur l'intention écarte une réponse enregistrée entre-temps.
 */
export const markJobApplicationTreatedElsewhere = async (jobId: ObjectId, applicationId: ObjectId, userAccess: ComputedUserAccess | undefined): Promise<void> => {
  await getConsultableJob(jobId, userAccess)
  const [application] = await getApplicationsWithApplicant(jobId, { _id: 1 }, applicationId)
  if (!application) {
    throw notFound("Candidature introuvable")
  }
  const now = new Date()
  const { matchedCount } = await getDbCollection("applications").updateOne(
    { _id: applicationId, job_id: jobId, company_recruitment_intention: null },
    { $set: { company_recruitment_intention: APPLICATION_TREATED_ELSEWHERE, company_recruitment_intention_date: now, last_update_at: now } }
  )
  if (!matchedCount) {
    throw conflict("Une réponse a déjà été enregistrée pour cette candidature")
  }
}

/**
 * Jeton des formulaires de réponse au candidat, pour les ouvrir depuis l'espace pro (#5769) : ce sont ceux du
 * mail au recruteur, signés pour le gestionnaire de l'offre comme dans le mail, mais valables 2 heures.
 */
export const getJobApplicationReplyTokenForRecruiter = async (
  jobId: ObjectId,
  applicationId: ObjectId,
  intention: ApplicationIntention,
  userAccess: ComputedUserAccess | undefined
): Promise<{ token: string }> => {
  const job = await getConsultableJob(jobId, userAccess)
  const [application] = await getApplicationsWithApplicant(jobId, { _id: 1 }, applicationId)
  if (!application) {
    throw notFound("Candidature introuvable")
  }
  // Le formulaire programme une réponse dès son ouverture : il ne doit pas écraser une réponse donnée hors de LBA.
  if (application.company_recruitment_intention === APPLICATION_TREATED_ELSEWHERE) {
    throw conflict("Vous avez déjà indiqué avoir répondu au candidat par un autre canal")
  }
  const manager = await getUserManagingOffer(job)
  return { token: generateApplicationReplyToken(buildUserForToken(application, manager), applicationId.toString(), intention, "2h") }
}
