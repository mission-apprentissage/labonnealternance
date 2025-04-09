import { PageWithParams } from "@/app/(espace-pro)/espace-pro/(connected)/entreprise/offre/[job_id]/PageWithParams"
import { getSession } from "@/utils/getSession"

export default async function Page() {
  const { user } = await getSession()
  if (!user) return null
  const { establishment_id } = user
  return <PageWithParams establishment_id={establishment_id} />
}
