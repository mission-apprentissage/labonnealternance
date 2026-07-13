"use client"

import { Box, Typography } from "@mui/material"
import { useParams } from "next/navigation"
import { Breadcrumb } from "@/app/_components/Breadcrumb"
import { PAGES } from "@/utils/routes.utils"

export default function AdminUserCfaPage() {
  const { userId } = useParams() as { userId: string }

  return (
    <Box sx={{ maxWidth: 1200, marginX: "auto" }}>
      <Breadcrumb pages={[PAGES.static.backAdminHome, PAGES.dynamic.backAdminRecruteurOffres({ user_id: userId }), PAGES.dynamic.backAdminUserCfa({ user_id: userId })]} />
      <Typography component="h1" sx={{ fontSize: "32px", fontWeight: 700 }}>
        Page en construction
      </Typography>
    </Box>
  )
}
