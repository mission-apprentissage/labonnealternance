import { PageWithParams } from "@/app/(espace-pro)/espace-pro/(connected)/entreprise/offre/[job_id]/PageWithParams"
import { getConnectedSessionUser } from "@/utils/sessionUtils"

export default async function Page() {
  const {
    user: { establishment_id },
  } = await getConnectedSessionUser()
  return <PageWithParams establishment_id={establishment_id} />
}
