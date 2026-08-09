import type { Metadata } from "next"
import { PAGES } from "@/utils/routes.utils"
import CfaCreationOffrePage from "./CfaCreationOffrePage"

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false

export async function generateMetadata({ params }: { params: Promise<{ establishment_id: string }> }): Promise<Metadata> {
  const { establishment_id } = await params
  return {
    title: PAGES.dynamic.backCfaEntrepriseCreationOffre(establishment_id).getMetadata().title,
  }
}

export default async function Page() {
  return <CfaCreationOffrePage />
}
