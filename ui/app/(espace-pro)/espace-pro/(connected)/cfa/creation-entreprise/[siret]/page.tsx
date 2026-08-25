import type { Metadata } from "next"
import { METADATA } from "@/utils/routes.metadata.utils"
import CreationEntrepriseDetailPage from "./CreationEntrepriseDetailPage"
export async function generateMetadata({ params }: { params: Promise<{ siret: string }> }): Promise<Metadata> {
  const { siret } = await params
  return {
    title: METADATA.dynamic.backCfaEntrepriseCreationDetail(siret).title,
  }
}

export default async function Page() {
  return <CreationEntrepriseDetailPage />
}
