import { updateSEO } from "@/jobs/seo/updateSEO"

export const up = async () => {
  await updateSEO()
}

// set to false ONLY IF migration does not imply a breaking change (ex: update field value or add index)
export const requireShutdown: boolean = false
