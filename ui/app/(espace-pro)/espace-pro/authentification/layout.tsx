import { fr } from "@codegouvfr/react-dsfr"
import { Box } from "@mui/material"
import type { PropsWithChildren } from "react"

import { PublicHeader } from "@/app/(espace-pro)/_components/PublicHeader"
import { Footer } from "@/app/_components/Footer"
import { getSession } from "@/utils/getSession"

export default async function AuthentificationLayout({ children }: PropsWithChildren) {
  const { user } = await getSession()

  return (
    <>
      <PublicHeader user={user} />
      <Box maxWidth={1200} paddingTop={fr.spacing("3v")} paddingBottom={fr.spacing("3v")} marginX="auto">
        {children}
      </Box>
      <Footer />
    </>
  )
}
