import { Typography } from "@mui/material"
import type { Metadata } from "next"
import { Breadcrumb } from "@/app/_components/Breadcrumb"
import { METADATA } from "@/utils/routes.metadata.utils"
import { PAGES } from "@/utils/routes.utils"
import { RecruteursList } from "./RecruteursList"
export const metadata: Metadata = {
  title: METADATA.static.backAdminGestionDesRecruteurs().title,
}

export default async function GestionDesRecruteurs() {
  return (
    <>
      <Breadcrumb pages={[PAGES.static.backAdminGestionDesRecruteurs]} />
      <Typography variant="h2" component="h1" gutterBottom>
        {PAGES.static.backAdminGestionDesRecruteurs.title}
      </Typography>
      <RecruteursList />
    </>
  )
}
