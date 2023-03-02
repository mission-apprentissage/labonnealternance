import { Application } from "../common/model/index.js"

export const getApplication = (offreId: string) => Application.find({ job_id: offreId }).lean()
