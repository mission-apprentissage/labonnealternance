import { Box, Typography } from "@mui/material"
import type { Metadata } from "next"
import { Breadcrumb } from "@/app/_components/Breadcrumb"
import { ModerationQueue } from "@/app/(espace-pro)/espace-pro/(connected)/_components/moderation/ModerationQueue"
import { MODERATION_PAGES } from "@/utils/moderation-pages.utils"
import { PAGES } from "@/utils/routes.utils"

export const metadata: Metadata = {
  title: `${MODERATION_PAGES.opcoQueue.title} - La bonne alternance`,
}

export default async function OffresAModererOpcoPage() {
  return (
    <Box sx={{ px: { xs: 2, md: 0 } }}>
      <Breadcrumb pages={[PAGES.static.backOpcoHome, MODERATION_PAGES.opcoQueue]} />
      <Typography variant="h2" component="h1" gutterBottom>
        {MODERATION_PAGES.opcoQueue.title}
      </Typography>
      <ModerationQueue userType="OPCO" />
    </Box>
  )
}
