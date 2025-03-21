import { fr } from "@codegouvfr/react-dsfr"
import { Box } from "@mui/material"
import type { PropsWithChildren } from "react"

import { ConnectedHeader } from "@/app/(espace-pro)/espace-pro/(connected)/_components/ConnectedHeader"
import { Footer } from "@/app/_components/Footer"
import { getSession } from "@/utils/getSession"

import { UserContextProvider } from "../contexts/userContext"

export default async function EspaceProConnecteLayout({ children }: PropsWithChildren) {
  const { user, access } = await getSession()

  if (user == null) {
    throw new Error("User is not connected")
  }

  return (
    <UserContextProvider user={user} access={access}>
      <ConnectedHeader user={user} />
      <Box sx={{ marginBottom: fr.spacing("4w") }}>{children}</Box>
      <Footer />
    </UserContextProvider>
  )
}
