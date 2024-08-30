import { addJob } from "job-processor"

export const up = async () => {
  addJob({ name: "remove:duplicates:recruiters", queued: false })
}
