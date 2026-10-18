import { Typography } from "@mui/material"
import type { Metadata } from "next"
import { Breadcrumb } from "@/app/_components/Breadcrumb"
import { ModerationQueue } from "@/app/(espace-pro)/espace-pro/(connected)/_components/moderation/ModerationQueue"
import { MODERATION_PAGES } from "@/utils/moderation-pages.utils"

export const metadata: Metadata = {
  title: "Offres à modérer - La bonne alternance",
}

export default async function OffresAModererAdminPage() {
  return (
    <>
      <Breadcrumb pages={[MODERATION_PAGES.adminQueue]} />
      <Typography variant="h2" component="h1" gutterBottom>
        {MODERATION_PAGES.adminQueue.title}
      </Typography>
      <ModerationQueue userType="ADMIN" />
    </>
  )
}
