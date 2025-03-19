import { fr } from "@codegouvfr/react-dsfr"
import { Box } from "@mui/material"
import type { PropsWithChildren } from "react"

import { DisconnectedHeader } from "@/app/(espace-pro)/_components/DisconnectedHeader"
import { Footer } from "@/app/_components/Footer"

export default async function RecruteurLayout({ children }: PropsWithChildren) {
  return (
    <>
      <DisconnectedHeader />
      <Box sx={{ marginBottom: fr.spacing("4w") }}>{children}</Box>
      <Footer />
    </>
  )
}
