import type { Metadata } from "next"
import { getSession } from "@/utils/getSession"
import { PAGES } from "@/utils/routes.utils"
import { EntrepriseInformationsPage } from "./EntrepriseInformationsPage"

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
