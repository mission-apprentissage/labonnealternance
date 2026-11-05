import { Typography } from "@mui/material"
import type { Metadata } from "next"
import { Breadcrumb } from "@/app/_components/Breadcrumb"
import { ModerationSearch } from "@/app/(espace-pro)/espace-pro/(connected)/_components/moderation/ModerationSearch"
import { MODERATION_PAGES } from "@/utils/moderation-pages.utils"

export const metadata: Metadata = {
  title: "Rechercher une offre - La bonne alternance",
}

export default async function RechercherUneOffreAdminPage() {
  return (
    <>
      <Breadcrumb pages={[MODERATION_PAGES.adminSearch]} />
      <Typography variant="h2" component="h1" gutterBottom>
        {MODERATION_PAGES.adminSearch.title}
      </Typography>
      <ModerationSearch />
    </>
  )
}
