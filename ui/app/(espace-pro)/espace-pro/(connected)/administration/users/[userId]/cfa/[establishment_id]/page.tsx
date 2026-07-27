import type { Metadata } from "next"
import { PAGES } from "@/utils/routes.utils"
import AdminUserCfaEntreprisePage from "./AdminUserCfaEntreprisePage"

export async function generateMetadata({ params }: { params: { userId: string; establishment_id: string } }): Promise<Metadata> {
  const { userId, establishment_id } = params
  return { title: PAGES.dynamic.backAdminUserCfaEntreprise({ user_id: userId, establishment_id }).getMetadata().title }
}

export default async function Page() {
  return <AdminUserCfaEntreprisePage />
}
