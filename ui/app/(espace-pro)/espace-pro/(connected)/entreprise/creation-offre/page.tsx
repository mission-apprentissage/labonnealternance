import type { Metadata } from "next"
import { BackEntrepriseUpsertOffre } from "@/app/(espace-pro)/espace-pro/(connected)/_components/BackEntrepriseUpsertOffre"
import { getSession } from "@/utils/get-session"
import { PAGES } from "@/utils/routes.utils"

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false

export const metadata: Metadata = {
  title: PAGES.static.backEntrepriseCreationOffre.getMetadata().title,
}

export default async function Page() {
  const { user } = await getSession()
  if (!user) return null
  const { establishment_id } = user

  return <BackEntrepriseUpsertOffre establishment_id={establishment_id} />
}
