import type { Metadata } from "next"
import { ModerationJobDetailPage } from "@/app/(espace-pro)/espace-pro/(connected)/_components/moderation/ModerationJobDetail"

export const metadata: Metadata = {
  title: "Modération d'une offre - La bonne alternance",
}

export default async function ModerationOffreOpcoPage() {
  return <ModerationJobDetailPage userType="OPCO" />
}
