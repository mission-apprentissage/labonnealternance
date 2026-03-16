import type { Metadata } from "next"
import { PAGES } from "@/utils/routes.utils"
import User from "./User"

export async function generateMetadata({ params }: { params: Promise<{ userId: string }> }): Promise<Metadata> {
  const { userId } = await params
  return {
    title: PAGES.dynamic.backAdminRecruteurOffres({ user_id: userId }).getMetadata().title,
  }
}

export default async function AdministrationUserPage() {
  return <User />
}
