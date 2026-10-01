import type { Metadata } from "next"
import { METADATA } from "@/utils/routes.metadata.utils"
import EditAdministrateur from "./editAdministrateur"
export async function generateMetadata({ params }: { params: Promise<{ userId: string }> }): Promise<Metadata> {
  const { userId } = await params
  return {
    title: METADATA.dynamic.backEditAdministrator({ userId }).title,
  }
}

export default async function AdministrationEditAdministrateur({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params
  return <EditAdministrateur userId={userId} />
}
