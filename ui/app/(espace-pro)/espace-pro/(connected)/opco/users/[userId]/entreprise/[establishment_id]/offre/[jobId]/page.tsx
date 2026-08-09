import type { Metadata } from "next"
import { OPCO } from "shared/constants/recruteur"
import { PAGES } from "@/utils/routes.utils"
import OpcoOffrePage from "./OpcoOffrePage"

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false

export async function generateMetadata({ params }: { params: Promise<{ jobId: string; establishment_id: string; userId: string }> }): Promise<Metadata> {
  const { jobId, establishment_id, userId } = await params
  return {
    title: PAGES.dynamic.offreUpsert({ establishment_id, offerId: jobId, userType: OPCO, userId }).getMetadata().title,
  }
}

export default async function Page() {
  return <OpcoOffrePage />
}
