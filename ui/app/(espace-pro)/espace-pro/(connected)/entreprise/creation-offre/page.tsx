import { BackEntrepriseUpsertOffre } from "@/app/(espace-pro)/espace-pro/(connected)/_components/BackEntrepriseUpsertOffre"
import { getSession } from "@/utils/getSession"

export default async function Page() {
  const { user } = await getSession()
  if (!user) return null
  const { establishment_id } = user

  return <BackEntrepriseUpsertOffre establishment_id={establishment_id} />
}
