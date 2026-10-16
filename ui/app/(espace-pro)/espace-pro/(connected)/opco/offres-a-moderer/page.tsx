import { Box, Typography } from "@mui/material"
import type { Metadata } from "next"
import { Breadcrumb } from "@/app/_components/Breadcrumb"
import { ModerationQueue } from "@/app/(espace-pro)/espace-pro/(connected)/_components/moderation/ModerationQueue"
import { METADATA } from "@/utils/routes.metadata.utils"
import { PAGES } from "@/utils/routes.utils"

export const metadata: Metadata = {
  title: METADATA.static.backOpcoOffresAModerer().title,
}

export default async function OffresAModererOpcoPage() {
  return (
    <Box sx={{ px: { xs: 2, md: 0 } }}>
      <Breadcrumb pages={[PAGES.static.backOpcoHome, PAGES.static.backOpcoOffresAModerer]} />
      <Typography variant="h2" component="h1" gutterBottom>
        {PAGES.static.backOpcoOffresAModerer.title}
      </Typography>
      <ModerationQueue userType="OPCO" />
    </Box>
  )
}
