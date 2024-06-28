import { getDbCollection } from "@/common/utils/mongodbUtils"

import { logger } from "../../../common/logger"

export const createOffreCollection = async () => {
  logger.info("Creating offres collections...")
  await getDbCollection("recruiters").aggregate([
    { $unwind: "$jobs" },
    {
      $project: {
        // champs générés ou supprimés
        jobId: { $toString: "$jobs._id" },
        recruiterId: "$_id",
        recruiterStatus: "$status",
        _id: 0,

        // champs de recruiters.jobs
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
        job_prolongation_count: "$jobs.job_prolongation_count",
        relance_mail_sent: "$jobs.relance_mail_sent",
        job_status: "$jobs.job_status",
        job_status_comment: "$jobs.job_status_comment",
        job_type: "$jobs.job_type",
        is_multi_published: "$jobs.is_multi_published",
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

        // champs de recruiters
        establishment_raison_sociale: 1,
        establishment_id: 1,
        establishment_enseigne: 1,
        establishment_siret: 1,
        address_detail: 1,
        address: 1,
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
    { $out: "jobs" },
  ])
}
