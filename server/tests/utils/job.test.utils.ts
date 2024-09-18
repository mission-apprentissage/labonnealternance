import { ObjectId } from "mongodb"
import { IJob, JOB_STATUS } from "shared/models"

export const jobFactory = (props: Partial<IJob> = {}) => {
  const job: IJob = {
    _id: new ObjectId(),
    rome_label: "rome_label",
    rome_appellation_label: "rome_appellation_label",
    job_level_label: "BTS, DEUST, autres formations niveau (Bac+2)",
    job_start_date: new Date(),
    job_description: "job_description",
    job_employer_description: "job_employer_description",
    rome_code: ["rome_code"],
    job_creation_date: new Date(),
    job_expiration_date: new Date(),
    job_update_date: new Date(),
    job_last_prolongation_date: new Date(),
    job_prolongation_count: 0,
    relance_mail_sent: false,
    job_status: JOB_STATUS.ACTIVE,
    job_status_comment: "job_status_comment",
    job_type: ["Apprentissage"],
    is_multi_published: false,
    job_delegation_count: 0,
    delegations: [],
    is_disabled_elligible: false,
    job_count: 1,
    job_duration: 6,
    job_rythm: "Indifférent",
    custom_address: "custom_address",
    custom_geo_coordinates: "custom_geo_coordinates",
    stats_detail_view: 0,
    stats_search_view: 0,
    managed_by: new ObjectId().toString(),
    ...props,
  }
  return job
}
