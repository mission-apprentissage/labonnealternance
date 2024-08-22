import { addJob } from "@/jobs/jobs_actions"

export const up = async () => {
  await addJob({ name: "referentiel:commune:import", queued: true, payload: {} })
}
