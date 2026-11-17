import { forbidden, notFound } from "@hapi/boom"
import { stringify } from "csv-stringify/sync"
import type { ObjectId } from "mongodb"
import type { zRoutes } from "shared"
import { ApplicationIntention } from "shared/constants/application"
import dayjs from "shared/helpers/dayjs"
import type { ComputedUserAccess, IApplicant, IApplication } from "shared/models/index"
import type { IJobsPartnersOfferPrivate } from "shared/models/jobs-partners.model"
import { JOBPARTNERS_LABEL } from "shared/models/jobs-partners.model"
import { getApplicationsConsultation } from "shared/utils/applications-consultation"
import { getApplicationsExportFileName } from "shared/utils/applications-export"
import { decodeSanitizedText } from "shared/utils/string-utils"
import type { z } from "zod"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import { canAccessJobAsEntrepriseOrCfa } from "@/security/authorisation.service"

type IJobApplicationsResponse = z.output<(typeof zRoutes)["get"]["/application/job/:jobId"]["response"]["200"]>

const getConsultableJob = async (jobId: ObjectId, userAccess: ComputedUserAccess | undefined): Promise<IJobsPartnersOfferPrivate> => {
  const job = await getDbCollection("jobs_partners").findOne({ _id: jobId, partner_label: JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA })
  if (!job) {
    throw notFound("Offre introuvable")
  }
  // La route contrôle déjà l'accès à l'offre ; ce contrôle-ci écarte en plus le rattachement OPCO.
  if (!(await canAccessJobAsEntrepriseOrCfa(userAccess, job))) {
    throw forbidden("Accès réservé au recruteur de l'offre")
  }
  if (job.offer_expiration && getApplicationsConsultation(job.offer_expiration).status === "unavailable") {
    throw forbidden("Les candidatures de cette offre ne sont plus consultables")
  }
  return job
}

// $unwind écarte les candidatures dont le candidat a été anonymisé : il n'y a plus rien à afficher.
const getApplicationsWithApplicant = (jobId: ObjectId, applicantFields: Partial<Record<keyof IApplicant, 1>>) =>
  getDbCollection("applications")
    .aggregate<IApplication & { applicant: Pick<IApplicant, "firstname" | "lastname" | "email" | "phone"> }>([
      { $match: { job_id: jobId } },
      { $lookup: { from: "applicants", localField: "applicant_id", foreignField: "_id", pipeline: [{ $project: applicantFields }], as: "applicant" } },
      { $unwind: "$applicant" },
      { $sort: { created_at: -1 } },
    ])
    .toArray()

/** Candidatures d'une offre LBA pour son recruteur ou le CFA qui la gère (#5769). */
export const getJobApplicationsForRecruiter = async (jobId: ObjectId, userAccess: ComputedUserAccess | undefined): Promise<IJobApplicationsResponse> => {
  const job = await getConsultableJob(jobId, userAccess)
  const applications = await getApplicationsWithApplicant(jobId, { firstname: 1, lastname: 1 })

  return {
    job: {
      _id: job._id,
      offer_title: job.offer_title,
      offer_rome_appellation: job.offer_rome_appellation ?? null,
      offer_expiration: job.offer_expiration ?? null,
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

// Mêmes libellés que la page des candidatures : toute intention autre que le refus vaut prise de contact.
const formatStatus = (intention: string | null | undefined) => (!intention ? "En attente" : intention === ApplicationIntention.REFUS ? "Refusé" : "Contacté")

/**
 * Récapitulatif des candidatures d'une offre, en CSV séparé par des tabulations (#5769).
 * Seul le nom de la pièce jointe figure dans le fichier, jamais son contenu.
 */
export const exportJobApplicationsForRecruiter = async (jobId: ObjectId, userAccess: ComputedUserAccess | undefined): Promise<{ fileName: string; content: string }> => {
  const job = await getConsultableJob(jobId, userAccess)
  const applications = await getApplicationsWithApplicant(jobId, { firstname: 1, lastname: 1, email: 1, phone: 1 })

  // Une colonne par question posée, dans l'ordre où elles apparaissent.
  const questions = [
    ...new Set(applications.flatMap(({ applicant_answers_to_recruiter_questions }) => (applicant_answers_to_recruiter_questions ?? []).map(({ question }) => question))),
  ]

  const columns = [
    "Prénom",
    "Nom",
    "E-mail",
    "Téléphone",
    "Date de candidature",
    "Statut",
    "Date de la réponse",
    "Réponse du recruteur",
    "Motifs de refus",
    "Message du candidat",
    "Pièce jointe",
    "Pièce jointe supprimée le",
    "Inscrit en formation",
    "Formation suivie",
    "Rythme de la formation",
    "Durée de contrat souhaitée",
    "Début de contrat souhaité",
    "Métier recherché",
    ...questions.map(formatText),
  ]

  const rows = applications.map((application) => {
    const answers = new Map((application.applicant_answers_to_recruiter_questions ?? []).map(({ question, answer }) => [question, answer]))
    return [
      application.applicant.firstname,
      application.applicant.lastname.toUpperCase(),
      application.applicant.email,
      // Apostrophe comme dans l'export des OPCO : sans elle, le tableur lit un nombre et retire le 0 initial.
      application.applicant.phone ? `'${application.applicant.phone}` : "",
      formatDate(application.created_at),
      formatStatus(application.company_recruitment_intention),
      formatDate(application.company_feedback_date ?? application.company_recruitment_intention_date),
      formatText(application.company_feedback),
      (application.company_feedback_reasons ?? []).join(", "),
      formatText(application.applicant_message_to_company),
      application.applicant_attachment_name,
      formatDate(application.applicant_attachment_deleted_at),
      formatBoolean(application.applicant_inscription_formation),
      formatText(application.applicant_formation_description),
      formatText(application.applicant_rythm_description),
      formatText(application.applicant_contract_duration),
      (application.applicant_contract_start ?? []).join(", "),
      formatText(application.job_searched_by_user),
      ...questions.map((question) => formatText(answers.get(question))),
    ]
  })

  // BOM : Excel lit sinon le fichier en Windows-1252. escape_formulas neutralise les textes saisis par le
  // candidat qui commenceraient par = + - @ (injection de formule à l'ouverture dans un tableur).
  const content = stringify([columns, ...rows], { delimiter: "\t", bom: true, escape_formulas: true })
  return { fileName: getApplicationsExportFileName(job.offer_title), content }
}
