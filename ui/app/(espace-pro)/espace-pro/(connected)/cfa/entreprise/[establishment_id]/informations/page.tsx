import type { Metadata } from "next"
import { getSession } from "@/utils/get-session"
import { PAGES } from "@/utils/routes.utils"
import { EntrepriseInformationsPage } from "./EntrepriseInformationsPage"

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false

export async function generateMetadata({ params }: { params: Promise<{ establishment_id: string }> }): Promise<Metadata> {
  const { establishment_id } = await params
  return {
    title: PAGES.dynamic.backCfaPageInformations(establishment_id).getMetadata().title,
  }
}

export default async function Page({ params }: { params: Promise<{ establishment_id: string }> }) {
  const { user } = await getSession()
  if (!user) return null
  const { establishment_id } = await params
  return <EntrepriseInformationsPage establishment_id={establishment_id} />
}
