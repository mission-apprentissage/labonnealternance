import { fr } from "@codegouvfr/react-dsfr"
import { Box } from "@mui/material"
import type { PropsWithChildren } from "react"

import { ConnectedHeader } from "./_components/ConnectedHeader"
import { UserContextProvider } from "@/app/(espace-pro)/espace-pro/contexts/userContext"
import { AuthWatcher } from "@/app/_components/AuthWatcher"
import { Footer } from "@/app/_components/Footer"
import { getSession } from "@/utils/getSession"

export default async function EspaceProConnecteLayout({ children }: PropsWithChildren) {
  const { user, access } = await getSession()

  if (user == null) {
    throw new Error("User is not connected")
  }

  return (
    <UserContextProvider user={user} access={access}>
      <ConnectedHeader user={user} />
      <Box component="main" role="main" sx={{ marginBottom: fr.spacing("4w") }}>
        {children}
      </Box>
      <Footer />
      <AuthWatcher user={user} />
    </UserContextProvider>
  )
}
