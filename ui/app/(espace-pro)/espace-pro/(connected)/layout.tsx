import { fr } from "@codegouvfr/react-dsfr"
import SkipLinks from "@codegouvfr/react-dsfr/SkipLinks"
import { Box } from "@mui/material"
import type { PropsWithChildren } from "react"
import { AuthWatcher } from "@/app/_components/AuthWatcher"
import { Footer } from "@/app/_components/Footer"
import { UserContextProvider } from "@/app/(espace-pro)/espace-pro/contexts/userContext"
import { getSession } from "@/utils/getSession"
import { ConnectedHeader } from "./_components/ConnectedHeader"

export default async function EspaceProConnecteLayout({ children }: PropsWithChildren) {
  const { user, access } = await getSession()

  if (user == null) {
    throw new Error("User is not connected")
  }

  return (
    <UserContextProvider user={user} access={access}>
      <SkipLinks
        links={[
          { label: "Menu", anchor: "#header-links" },
          { label: "Contenu", anchor: "#main-content" },
          { label: "Pied de page", anchor: "#footer-links" },
        ]}
      />
      <ConnectedHeader user={user} />
      <Box component="main" id="main-content" tabIndex={-1} role="main" sx={{ marginBottom: fr.spacing("8v") }}>
        {children}
      </Box>
      <Footer />
      <AuthWatcher user={user} />
    </UserContextProvider>
  )
}
