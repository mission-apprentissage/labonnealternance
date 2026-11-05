import { Typography } from "@mui/material"
import type { Metadata } from "next"
import { Breadcrumb } from "@/app/_components/Breadcrumb"
import { RGPD_PAGES } from "@/utils/rgpd-pages.utils"
import { RgpdErasureForm } from "./_components/RgpdErasureForm"

export const metadata: Metadata = {
  title: "Effacement RGPD - La bonne alternance",
}

export default async function RgpdErasureAdminPage() {
  return (
    <>
      <Breadcrumb pages={[RGPD_PAGES.admin]} />
      <Typography variant="h2" component="h1" gutterBottom>
        {RGPD_PAGES.admin.title}
      </Typography>
      <RgpdErasureForm />
    </>
  )
}
