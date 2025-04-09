import { fr } from "@codegouvfr/react-dsfr"
import { Box } from "@mui/material"
import type { PropsWithChildren } from "react"

import { PublicHeader } from "@/app/(espace-pro)/_components/PublicHeader"
import { Footer } from "@/app/_components/Footer"
import { getSession } from "@/utils/getSession"

export default async function PublicLayout({ children }: PropsWithChildren) {
  const { user } = await getSession()

  return (
    <>
      <PublicHeader user={user} />
      <Box sx={{ marginBottom: fr.spacing("4w") }}>{children}</Box>
      <Footer />
    </>
  )
}
