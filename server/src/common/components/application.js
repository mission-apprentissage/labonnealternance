import { Application } from "../model/index.js"

export default () => ({
  getApplication: (offreId) => Application.findOne({ job_id: offreId }).lean(),
})
