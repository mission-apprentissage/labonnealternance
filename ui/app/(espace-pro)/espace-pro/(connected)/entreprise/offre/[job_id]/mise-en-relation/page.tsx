import MiseEnRelation from "@/app/(espace-pro)/espace-pro/(connected)/entreprise/offre/[job_id]/mise-en-relation/MiseEnRelation"
import { getSession } from "@/utils/getSession"

export default async function Page() {
  const { user } = await getSession()
  if (!user) return null
  const { establishment_id } = user
  return <MiseEnRelation establishment_id={establishment_id} />
}
