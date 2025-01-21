import { addJob } from "job-processor"

export const up = async () => {
  await addJob({ name: "recreate:indexes", payload: { drop: true }, queued: true })
}

// set to false ONLY IF migration does not imply a breaking change (ex: update field value or add index)
export const requireShutdown: boolean = true
