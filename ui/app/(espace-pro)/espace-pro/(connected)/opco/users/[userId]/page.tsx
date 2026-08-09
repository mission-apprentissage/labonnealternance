import type { Metadata } from "next"
import { PAGES } from "@/utils/routes.utils"
import User from "./User"

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false

export async function generateMetadata({ params }: { params: Promise<{ userId: string }> }): Promise<Metadata> {
  const { userId } = await params
  return {
    title: PAGES.dynamic.backOpcoInformationEntreprise({ user_id: userId }).getMetadata().title,
  }
}

export default async function AdministrationUserPage() {
  return <User />
}
