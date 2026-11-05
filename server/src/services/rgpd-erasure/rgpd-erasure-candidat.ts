import { internal } from "@hapi/boom"
import type { ObjectId } from "mongodb"
import anonymizedApplicantsModel from "shared/models/anonymized-applicant.model"
import anonymizedApplicationsModel from "shared/models/anonymized-applications.model"
import anonymizedAppointmentsModel from "shared/models/anonymized-appointments.model"
import anonymizedUsersModel from "shared/models/anonymized-users.model"
import type { IApplicant, IUser } from "shared/models/index"
import { RGPD_ERASURE_MODE } from "shared/models/index"
import type { IRgpdErasureMode } from "shared/models/rgpd-erasure.model"

import { getDbCollection } from "@/common/utils/mongodb-utils"
import { anonymizeAppointments } from "@/jobs/anonymization/anonymize-appointments"
import { deleteCvFilesForApplications } from "@/services/application-cv.service"
import { hashEmail } from "@/services/traffic-source.service"

import { buildBrevoStep } from "./rgpd-erasure-brevo"
import type { IRgpdStep } from "./rgpd-erasure-steps"
import { buildCopyStep } from "./rgpd-erasure-steps"

export type IRgpdCandidatContext = {
  applicant: IApplicant
  applicationIds: ObjectId[]
}

const blacklistStep = (emails: string[]): IRgpdStep => ({
  collection: "emailblacklists",
  action: "Adresse retirée de la liste de blocage",
  count: () => getDbCollection("emailblacklists").countDocuments({ email: { $in: emails } }),
  run: async () => (await getDbCollection("emailblacklists").deleteMany({ email: { $in: emails } })).deletedCount,
})

/** Les candidatures ne portent que `applicant_id` : l'e-mail du candidat n'existe que dans `applicants`. */
export const resolveRgpdCandidatContext = async (emails: string[], applicantId?: ObjectId): Promise<IRgpdCandidatContext | null> => {
  const applicant = await getDbCollection("applicants").findOne(applicantId ? { _id: applicantId } : { email: { $in: emails } })
  if (!applicant) return null
  const applications = await getDbCollection("applications")
    .find({ applicant_id: applicant._id }, { projection: { _id: 1 } })
    .toArray()
  return { applicant, applicationIds: applications.map(({ _id }) => _id) }
}

export const buildRgpdCandidatSteps = ({ applicant, applicationIds }: IRgpdCandidatContext, mode: IRgpdErasureMode, emails: string[]): IRgpdStep[] => {
  const applicationsFilter = { _id: { $in: applicationIds } }
  const cvFilter = { ...applicationsFilter, applicant_attachment_deleted_at: null }
  const applicantFilter = { _id: applicant._id }
  const emailLogsFilter = { $or: [{ applicant_id: applicant._id }, { application_id: { $in: applicationIds } }] }
  const trafficFilter = { $or: [{ application_id: { $in: applicationIds } }, { applicant_email_hash: { $in: emails.map(hashEmail) } }] }

  return [
    {
      // S3 en premier : la clé du CV dérive de applications._id (cf. getApplicationCvS3Key).
      collection: "s3 (CV)",
      action: "CV supprimés du stockage",
      count: () => getDbCollection("applications").countDocuments(cvFilter),
      run: async () => {
        const report = await deleteCvFilesForApplications(applicationsFilter, { context: "rgpd-erasure" })
        if (report.failedKeys.length) {
          throw internal(`${report.failedKeys.length} CV non supprimé(s) du stockage, effacement interrompu avant toute écriture en base`)
        }
        return report.deleted
      },
    },
    buildBrevoStep(applicant.email),
    ...(mode === RGPD_ERASURE_MODE.ANONYMIZE
      ? [
          buildCopyStep({
            collection: anonymizedApplicantsModel.collectionName,
            action: "Copie non nominative du candidat (date de création)",
            count: () => getDbCollection("applicants").countDocuments(applicantFilter),
            // _id gardé, contrairement au job anonymize-applicant-and-applications : $merge s'en sert de clé, une relance ne duplique pas la copie.
            copy: () =>
              getDbCollection("applicants")
                .aggregate([{ $match: applicantFilter }, { $project: { applicant_id: "$_id", createdAt: 1 } }, { $merge: anonymizedApplicantsModel.collectionName }])
                .toArray(),
          }),
          buildCopyStep({
            collection: anonymizedApplicationsModel.collectionName,
            action: "Copie non nominative des candidatures (SIRET, intention, dates)",
            count: () => getDbCollection("applications").countDocuments(applicationsFilter),
            copy: () =>
              getDbCollection("applications")
                .aggregate([
                  { $match: applicationsFilter },
                  {
                    $project: {
                      company_recruitment_intention: 1,
                      company_feedback_date: 1,
                      company_siret: 1,
                      company_naf: 1,
                      job_origin: 1,
                      job_id: 1,
                      caller: 1,
                      created_at: 1,
                      applicant_id: 1,
                    },
                  },
                  { $merge: anonymizedApplicationsModel.collectionName },
                ])
                .toArray(),
          }),
        ]
      : []),
    {
      collection: "applicants_email_logs",
      action: "Journal des e-mails envoyés au candidat supprimé",
      count: () => getDbCollection("applicants_email_logs").countDocuments(emailLogsFilter),
      run: async () => (await getDbCollection("applicants_email_logs").deleteMany(emailLogsFilter)).deletedCount,
    },
    {
      collection: "trafficsources",
      action: "Sources de trafic des candidatures supprimées",
      count: () => getDbCollection("trafficsources").countDocuments(trafficFilter),
      run: async () => (await getDbCollection("trafficsources").deleteMany(trafficFilter)).deletedCount,
    },
    {
      collection: "applications",
      action: "Candidatures supprimées",
      count: () => getDbCollection("applications").countDocuments(applicationsFilter),
      run: async () => (await getDbCollection("applications").deleteMany(applicationsFilter)).deletedCount,
    },
    blacklistStep(emails),
    {
      collection: "applicants",
      action: "Candidat supprimé",
      count: () => getDbCollection("applicants").countDocuments(applicantFilter),
      run: async () => (await getDbCollection("applicants").deleteOne(applicantFilter)).deletedCount,
    },
  ]
}

export type IRgpdRdvaContext = {
  users: IUser[]
}

export const resolveRgpdRdvaContext = async (emails: string[], userId?: ObjectId): Promise<IRgpdRdvaContext> => ({
  users: await getDbCollection("users")
    .find(userId ? { _id: userId } : { email: { $in: emails } })
    .toArray(),
})

export const buildRgpdRdvaSteps = ({ users }: IRgpdRdvaContext, mode: IRgpdErasureMode, emails: string[]): IRgpdStep[] => {
  const userIds = users.map(({ _id }) => _id)
  const usersFilter = { _id: { $in: userIds } }
  const appointmentsFilter = { applicant_id: { $in: userIds } }

  return [
    buildBrevoStep(emails[0]),
    mode === RGPD_ERASURE_MODE.ANONYMIZE
      ? {
          collection: "appointments",
          action: `Rendez-vous copiés sans données personnelles dans ${anonymizedAppointmentsModel.collectionName}, puis supprimés`,
          count: () => getDbCollection("appointments").countDocuments(appointmentsFilter),
          run: () => anonymizeAppointments(appointmentsFilter),
        }
      : {
          collection: "appointments",
          action: "Rendez-vous supprimés",
          count: () => getDbCollection("appointments").countDocuments(appointmentsFilter),
          run: async () => (await getDbCollection("appointments").deleteMany(appointmentsFilter)).deletedCount,
        },
    ...(mode === RGPD_ERASURE_MODE.ANONYMIZE
      ? [
          buildCopyStep({
            collection: anonymizedUsersModel.collectionName,
            action: "Copie non nominative (type, rôle, dernière action)",
            count: () => getDbCollection("users").countDocuments(usersFilter),
            copy: () =>
              getDbCollection("users")
                .aggregate([{ $match: usersFilter }, { $project: { _id: 1, type: 1, role: 1, last_action_date: 1 } }, { $merge: anonymizedUsersModel.collectionName }])
                .toArray(),
          }),
        ]
      : []),
    blacklistStep(emails),
    {
      collection: "users",
      action: "Candidat supprimé",
      count: () => getDbCollection("users").countDocuments(usersFilter),
      run: async () => (await getDbCollection("users").deleteMany(usersFilter)).deletedCount,
    },
  ]
}
