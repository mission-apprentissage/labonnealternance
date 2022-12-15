import { Application } from "../model/index.js"

export default () => ({
  getApplication: (offreId) => Application.find({ job_id: offreId }).lean(),
})
