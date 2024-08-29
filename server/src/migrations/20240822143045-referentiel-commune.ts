import { addJob } from "job-processor"

export const up = async () => {
  await addJob({ name: "referentiel:commune:import", queued: true, payload: {} })
}
