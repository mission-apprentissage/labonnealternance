import type { Metadata } from "next"
import EditAdministrateur from "./editAdministrateur"
import { PAGES } from "@/utils/routes.utils"

export async function generateMetadata({ params }: { params: Promise<{ userId: string }> }): Promise<Metadata> {
  const { userId } = await params
  return {
    title: PAGES.dynamic.backEditAdministrator({ userId }).getMetadata().title,
  }
}

export default async function AdministrationEditAdministrateur() {
  return <EditAdministrateur />
}
