import { Typography } from "@mui/material"
import type { Metadata } from "next"
import { Breadcrumb } from "@/app/_components/Breadcrumb"
import { ModerationQueue } from "@/app/(espace-pro)/espace-pro/(connected)/_components/moderation/ModerationQueue"
import { METADATA } from "@/utils/routes.metadata.utils"
import { PAGES } from "@/utils/routes.utils"

export const metadata: Metadata = {
  title: METADATA.static.backAdminOffresAModerer().title,
}

export default async function OffresAModererAdminPage() {
  return (
    <>
      <Breadcrumb pages={[PAGES.static.backAdminOffresAModerer]} />
      <Typography variant="h2" component="h1" gutterBottom>
        {PAGES.static.backAdminOffresAModerer.title}
      </Typography>
      <ModerationQueue userType="ADMIN" />
    </>
  )
}
