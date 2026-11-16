import { forbidden, notFound } from "@hapi/boom"
import type { ObjectId } from "mongodb"
import type { zRoutes } from "shared"
import type { ComputedUserAccess } from "shared/models/index"
import { JOBPARTNERS_LABEL } from "shared/models/jobs-partners.model"
import { getApplicationsConsultation } from "shared/utils/applications-consultation"
import type { z } from "zod"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import { canAccessJobAsEntrepriseOrCfa } from "@/security/authorisation.service"

type IJobApplicationsResponse = z.output<(typeof zRoutes)["get"]["/application/job/:jobId"]["response"]["200"]>

/** Candidatures d'une offre LBA pour son recruteur ou le CFA qui la gère (#5769). */
export const getJobApplicationsForRecruiter = async (jobId: ObjectId, userAccess: ComputedUserAccess | undefined): Promise<IJobApplicationsResponse> => {
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

  // $unwind écarte les candidatures dont le candidat a été anonymisé : il n'y a plus rien à afficher.
  const applications = await getDbCollection("applications")
    .aggregate<IJobApplicationsResponse["applications"][number]>([
      { $match: { job_id: jobId } },
      { $lookup: { from: "applicants", localField: "applicant_id", foreignField: "_id", pipeline: [{ $project: { firstname: 1, lastname: 1 } }], as: "applicant" } },
      { $unwind: "$applicant" },
      { $sort: { created_at: -1 } },
      {
        $project: {
          _id: 1,
          applicant_first_name: "$applicant.firstname",
          applicant_last_name: "$applicant.lastname",
          company_recruitment_intention: { $ifNull: ["$company_recruitment_intention", null] },
          created_at: { $ifNull: ["$created_at", null] },
        },
      },
    ])
    .toArray()

  return {
    job: {
      _id: job._id,
      offer_title: job.offer_title,
      offer_rome_appellation: job.offer_rome_appellation ?? null,
      offer_expiration: job.offer_expiration ?? null,
    },
    applications,
  }
}
