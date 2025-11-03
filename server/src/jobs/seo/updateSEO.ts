import { updateSeoVilleActivities, updateSeoVilleJobCounts } from "@/services/seo.service"

export const updateSEO = async () => {
  await updateSeoVilleJobCounts()
  await updateSeoVilleActivities()
}
