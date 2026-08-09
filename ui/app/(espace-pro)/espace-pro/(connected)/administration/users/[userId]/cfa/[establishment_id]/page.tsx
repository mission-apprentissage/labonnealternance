import type { Metadata } from "next"
import { PAGES } from "@/utils/routes.utils"
import AdminUserCfaEntreprisePage from "./AdminUserCfaEntreprisePage"

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false

export async function generateMetadata({ params }: { params: { userId: string; establishment_id: string } }): Promise<Metadata> {
  const { userId, establishment_id } = params
  return { title: PAGES.dynamic.backAdminUserCfaEntreprise({ user_id: userId, establishment_id }).getMetadata().title }
}

export default async function Page() {
  return <AdminUserCfaEntreprisePage />
}
