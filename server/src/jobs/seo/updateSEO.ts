import { updateSeoVilleJobCounts } from "@/services/seo.service"

export const updateSEO = async () => {
  await updateSeoVilleJobCounts()
}
