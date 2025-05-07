import MiseEnRelation from "@/app/(espace-pro)/_components/MiseEnRelation"
import { getSession } from "@/utils/getSession"

export default async function Page() {
  const { user } = await getSession()
  if (!user) return null
  const { establishment_id } = user
  return <MiseEnRelation establishment_id={establishment_id} />
}
