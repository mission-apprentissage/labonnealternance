import type { Metadata } from "next"
import { PAGES } from "@/utils/routes.utils"
import AdminUserCfaPage from "./AdminUserCfaPage"

export async function generateMetadata({ params }: { params: Promise<{ userId: string }> }): Promise<Metadata> {
  const { userId } = await params
  return { title: PAGES.dynamic.backAdminUserCfa({ user_id: userId }).getMetadata().title }
}

export default async function Page() {
  return <AdminUserCfaPage />
}
