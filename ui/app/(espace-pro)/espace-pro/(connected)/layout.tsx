import { fr } from "@codegouvfr/react-dsfr"
import SkipLinks from "@codegouvfr/react-dsfr/SkipLinks"
import { Box } from "@mui/material"
import { redirect } from "next/navigation"
import type { PropsWithChildren } from "react"
import { Suspense } from "react"
import { AuthWatcher } from "@/app/_components/AuthWatcher"
import { Footer } from "@/app/_components/Footer"
import { UserContextProvider } from "@/app/(espace-pro)/espace-pro/contexts/userContext"
import { getSession } from "@/utils/get-session"
import { ConnectedHeader } from "./_components/ConnectedHeader"
import { ConnectedShellSkeleton } from "./_components/ConnectedShellSkeleton"

export default function EspaceProConnecteLayout({ children }: PropsWithChildren) {
  return (
    <>
      <SkipLinks
        links={[
          { label: "Menu", anchor: "#header-links" },
          { label: "Contenu", anchor: "#main-content" },
          { label: "Pied de page", anchor: "#footer-links" },
        ]}
      />
      <Suspense fallback={<ConnectedShellSkeleton />}>
        <ConnectedShell>{children}</ConnectedShell>
      </Suspense>
    </>
  )
}

async function ConnectedShell({ children }: PropsWithChildren) {
  const { user, access } = await getSession()

  // ui/proxy.ts est le garde-fou principal (redirige avant même d'atteindre ce rendu React).
  // Ce redirect est un filet de sécurité si jamais cette route est atteinte sans session valide.
  if (user == null) {
    redirect("/espace-pro/authentification")
  }

  return (
    <UserContextProvider user={user} access={access}>
      <ConnectedHeader user={user} />
      <Box component="main" id="main-content" tabIndex={-1} role="main" sx={{ marginBottom: fr.spacing("8v") }}>
        {children}
      </Box>
      <Footer />
      <AuthWatcher user={user} />
    </UserContextProvider>
  )
}
