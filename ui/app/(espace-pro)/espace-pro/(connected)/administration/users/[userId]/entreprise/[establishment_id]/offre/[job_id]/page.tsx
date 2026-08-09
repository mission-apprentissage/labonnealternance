import type { Metadata } from "next"
import { ADMIN } from "shared/constants/recruteur"
import { PAGES } from "@/utils/routes.utils"
import AdminOffrePage from "./AdminOffrePage"

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false

export async function generateMetadata({ params }: { params: Promise<{ job_id: string; establishment_id: string; userId: string }> }): Promise<Metadata> {
  const { job_id, establishment_id, userId } = await params
  return {
    title: PAGES.dynamic.offreUpsert({ establishment_id, offerId: job_id, userType: ADMIN, userId }).getMetadata().title,
  }
}

export default async function Page() {
  return <AdminOffrePage />
}
