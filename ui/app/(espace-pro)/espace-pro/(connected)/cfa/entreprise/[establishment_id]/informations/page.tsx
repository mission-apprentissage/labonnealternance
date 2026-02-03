import type { Metadata } from "next"
import EntrepriseInformationsPage from "./EntrepriseInformationsPage"
import { PAGES } from "@/utils/routes.utils"

export async function generateMetadata({ params }: { params: Promise<{ establishment_id: string }> }): Promise<Metadata> {
  const { establishment_id } = await params
  return {
    title: PAGES.dynamic.backCfaPageInformations(establishment_id).getMetadata().title,
  }
}

export default async function Page() {
  return <EntrepriseInformationsPage />
}
