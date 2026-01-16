import type { Metadata } from "next"
import User from "./User"
import { PAGES } from "@/utils/routes.utils"

export async function generateMetadata({ params }: { params: Promise<{ userId: string }> }): Promise<Metadata> {
  const { userId } = await params
  return {
    title: PAGES.dynamic.backAdminRecruteurOffres({ user_id: userId }).getMetadata().title,
  }
}

export default async function AdministrationUserPage() {
  return <User />
}
