import { fr } from "@codegouvfr/react-dsfr"
import SkipLinks from "@codegouvfr/react-dsfr/SkipLinks"
import { Box } from "@mui/material"
import { cookies, headers } from "next/headers"
import { redirect } from "next/navigation"
import type { PropsWithChildren } from "react"
import { Suspense } from "react"
import { SESSION_COOKIE_NAME } from "shared/constants/session"
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
    // Si on arrive ici, le proxy a laissé passer une route protégée mais la session n'est pas
    // lisible dans ce rendu. Deux précautions (incident du 2026-09-02, boucle 307 ↔ 307) :
    // 1. tracer l'incohérence, sans contenu de session, pour pouvoir l'analyser dans Loki ;
    // 2. marquer le rebond avec sessionRetry pour que le proxy affiche la page de connexion au
    //    lieu de renvoyer vers l'espace pro, ce qui rebouclerait sur ce même redirect.
    const [headerStore, cookieStore] = await Promise.all([headers(), cookies()])
    console.error("[espace-pro] session absente dans le layout connecté", {
      hasSessionHeader: headerStore.has("x-session"),
      hasSessionCookie: cookieStore.has(SESSION_COOKIE_NAME),
    })
    redirect("/espace-pro/authentification?sessionRetry=true")
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
