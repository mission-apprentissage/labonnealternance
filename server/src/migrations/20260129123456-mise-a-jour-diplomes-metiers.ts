import { updateDiplomeMetier } from "@/jobs/diplomesMetiers/updateDiplomesMetiers"

export const up = async () => {
  await updateDiplomeMetier()
}

// set to false ONLY IF migration does not imply a breaking change (ex: update field value or add index)
export const requireShutdown: boolean = false
