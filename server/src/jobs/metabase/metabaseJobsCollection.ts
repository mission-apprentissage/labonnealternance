import jobsModel from "shared/models/jobs.model"

import { getDbCollection } from "@/common/utils/mongodbUtils"

import { logger } from "../../common/logger"
import { notifyToSlack } from "../../common/utils/slackUtils"

export const createJobsCollectionForMetabase = async () => {
  const initialCount = await getDbCollection("jobs").estimatedDocumentCount({})
  logger.info(`Old count: ${initialCount}`)
  await getDbCollection("recruiters")
    .aggregate([
      { $unwind: "$jobs" },
      {
        $lookup: {
          from: "referentielromes",
          localField: "jobs.rome_code.0",
          foreignField: "rome.code_rome",
          as: "referentielrome",
        },
      },
      { $unwind: { path: "$referentielrome", preserveNullAndEmptyArrays: true } },
      {
        $set: { "jobs.rome_detail": "$referentielrome" },
      },
      {
        $project: {
          // Champs générés ou supprimés
          jobId: { $toString: "$jobs._id" },
          recruiterId: "$_id",
          recruiterStatus: "$status",
          _id: 0,

          // Champs de recruiters.jobs
          rome_label: "$jobs.rome_label",
          rome_appellation_label: "$jobs.rome_appellation_label",
          job_level_label: "$jobs.job_level_label",
          job_start_date: "$jobs.job_start_date",
          job_description: "$jobs.job_description",
          job_employer_description: "$jobs.job_employer_description",
          rome_code: "$jobs.rome_code",
          job_creation_date: "$jobs.job_creation_date",
          job_expiration_date: "$jobs.job_expiration_date",
          job_update_date: "$jobs.job_update_date",
          job_last_prolongation_date: "$jobs.job_last_prolongation_date",
          mer_sent: "$jobs.mer_sent",
          job_prolongation_count: "$jobs.job_prolongation_count",
          job_status: "$jobs.job_status",
          job_status_comment: "$jobs.job_status_comment",
          job_type: "$jobs.job_type",
          job_delegation_count: "$jobs.job_delegation_count",
          delegations: "$jobs.delegations",
          is_disabled_elligible: "$jobs.is_disabled_elligible",
          job_count: "$jobs.job_count",
          job_duration: "$jobs.job_duration",
          job_rythm: "$jobs.job_rythm",
          custom_address: "$jobs.custom_address",
          custom_geo_coordinates: "$jobs.custom_geo_coordinates",
          stats_detail_view: "$jobs.stats_detail_view",
          stats_search_view: "$jobs.stats_search_view",
          rome_detail: "$jobs.rome_detail",
          offer_title_custom: "$jobs.offer_title_custom",
          relance_mail_expiration_J1: "$jobs.relance_mail_expiration_J1",
          relance_mail_expiration_J7: "$jobs.relance_mail_expiration_J7",

          // Champs de recruiters
          establishment_raison_sociale: 1,
          establishment_id: 1,
          establishment_enseigne: 1,
          establishment_siret: 1,
          address: 1,
          address_detail: 1,
          geo_coordinates: 1,
          is_delegated: 1,
          cfa_delegated_siret: 1,
          last_name: 1,
          first_name: 1,
          phone: 1,
          email: 1,
          origin: 1,
          opco: 1,
          idcc: 1,
          naf_code: 1,
          naf_label: 1,
          establishment_size: 1,
          establishment_creation_date: 1,
        },
      },
      {
        $project: {
          "rome_detail._id": 0,
        },
      },
      { $out: jobsModel.collectionName },
    ])
    .toArray()

  const newCount = await getDbCollection("jobs").estimatedDocumentCount({})
  logger.info(`New count: ${newCount}`)
  await notifyToSlack({
    subject: "JOBS METABASE COLLECTION",
    message: `${newCount - initialCount} nouveaux jobs ajoutés. (ancien compte: ${initialCount}/nouveau compte: ${newCount})`,
  })
}
