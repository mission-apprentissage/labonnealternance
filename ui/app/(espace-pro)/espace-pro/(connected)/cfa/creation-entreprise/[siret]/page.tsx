import type { Metadata } from "next"
import { PAGES } from "@/utils/routes.utils"
import CreationEntrepriseDetailPage from "./CreationEntrepriseDetailPage"

export async function generateMetadata({ params }: { params: Promise<{ siret: string }> }): Promise<Metadata> {
  const { siret } = await params
  return {
    title: PAGES.dynamic.backCfaEntrepriseCreationDetail(siret).getMetadata().title,
  }
}

export default async function Page() {
  return <CreationEntrepriseDetailPage />
}
