import { fr } from "@codegouvfr/react-dsfr"
import { Box } from "@mui/material"
import type { PropsWithChildren } from "react"

import { Footer } from "@/app/_components/Footer"
import { PublicHeader } from "@/app/_components/PublicHeader"
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
