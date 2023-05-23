import { Application } from "../common/model/index.js"
import { IJobs } from "../common/model/schema/jobs/jobs.types.js"

export const getApplication = (job_id: IJobs["_id"]) => Application.find({ job_id }).lean()
