import type { Metadata } from "next"
import { BackEntrepriseUpsertOffre } from "@/app/(espace-pro)/espace-pro/(connected)/_components/BackEntrepriseUpsertOffre"
import { getSession } from "@/utils/get-session"
import { METADATA } from "@/utils/routes.metadata.utils"

export const metadata: Metadata = {
  title: METADATA.static.backEntrepriseCreationOffre().title,
}

export default async function Page() {
  const { user } = await getSession()
  if (!user) return null
  const { establishment_id } = user

  return <BackEntrepriseUpsertOffre establishment_id={establishment_id} />
}
