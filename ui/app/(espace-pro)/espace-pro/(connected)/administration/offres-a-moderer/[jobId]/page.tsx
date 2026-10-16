import type { Metadata } from "next"
import { ModerationJobDetailPage } from "@/app/(espace-pro)/espace-pro/(connected)/_components/moderation/ModerationJobDetail"
import { METADATA } from "@/utils/routes.metadata.utils"

export const metadata: Metadata = {
  title: METADATA.dynamic.backModerationOffre().title,
}

export default async function ModerationOffreAdminPage() {
  return <ModerationJobDetailPage userType="ADMIN" />
}
