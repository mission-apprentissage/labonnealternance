import type { Metadata } from "next"
import { PAGES } from "@/utils/routes.utils"
import CreationEntrepriseDetailPage from "./CreationEntrepriseDetailPage"

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false

export async function generateMetadata({ params }: { params: Promise<{ siret: string }> }): Promise<Metadata> {
  const { siret } = await params
  return {
    title: PAGES.dynamic.backCfaEntrepriseCreationDetail(siret).getMetadata().title,
  }
}

export default async function Page() {
  return <CreationEntrepriseDetailPage />
}
