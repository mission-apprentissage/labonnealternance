import { fr } from "@codegouvfr/react-dsfr"
import { Box } from "@mui/material"
import type { PropsWithChildren } from "react"

import { ProtectedHeader } from "@/app/(espace-pro)/_components/ProtectedHeader"
import { Footer } from "@/app/_components/Footer"

export default function PublicLayout({ children }: PropsWithChildren) {
  return (
    <>
      <ProtectedHeader />
      <Box sx={{ marginBottom: fr.spacing("4w") }}>{children}</Box>
      <Footer />
    </>
  )
}
