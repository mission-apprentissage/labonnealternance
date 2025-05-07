import MiseEnRelation from "@/app/(espace-pro)/_components/MiseEnRelation"
import { getSession } from "@/utils/getSession"

export default async function Page({ params }) {
  const { user } = await getSession()
  if (!user) return null
  const { establishment_id } = user

  const { job_id } = await params
  return <MiseEnRelation job_id={job_id} establishment_id={establishment_id} />
}
