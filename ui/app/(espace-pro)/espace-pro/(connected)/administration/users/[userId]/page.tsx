import type { Metadata } from "next"
import { METADATA } from "@/utils/routes.metadata.utils"
import User from "./User"
export async function generateMetadata({ params }: { params: Promise<{ userId: string }> }): Promise<Metadata> {
  const { userId } = await params
  return {
    title: METADATA.dynamic.backAdminRecruteurOffres({ user_id: userId }).title,
  }
}

export default async function AdministrationUserPage() {
  return <User />
}
