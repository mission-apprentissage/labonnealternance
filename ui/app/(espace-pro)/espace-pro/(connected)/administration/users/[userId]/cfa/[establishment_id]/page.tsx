import type { Metadata } from "next"
import { METADATA } from "@/utils/routes.metadata.utils"
import AdminUserCfaEntreprisePage from "./AdminUserCfaEntreprisePage"
export async function generateMetadata({ params }: { params: { userId: string; establishment_id: string } }): Promise<Metadata> {
  const { userId, establishment_id } = params
  return { title: METADATA.dynamic.backAdminUserCfaEntreprise({ user_id: userId, establishment_id }).title }
}

export default async function Page() {
  return <AdminUserCfaEntreprisePage />
}
