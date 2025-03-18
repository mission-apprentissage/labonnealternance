import { BackEntrepriseUpsertOffre } from "@/app/(espace-pro)/espace-pro/(connected)/_components/BackEntrepriseUpsertOffre"
import { getConnectedSessionUser } from "@/utils/sessionUtils"

export default async function Page() {
  const {
    user: { establishment_id },
  } = await getConnectedSessionUser()

  return <BackEntrepriseUpsertOffre establishment_id={establishment_id} />
}
