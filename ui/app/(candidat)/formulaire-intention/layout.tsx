import { fr } from "@codegouvfr/react-dsfr"
import SkipLinks from "@codegouvfr/react-dsfr/SkipLinks"
import { Box } from "@mui/material"
import type { PropsWithChildren } from "react"
import { Suspense } from "react"
import { Footer } from "@/app/_components/Footer"
import { PublicHeader, PublicHeaderStatic } from "@/app/_components/PublicHeader"
import { getSession } from "@/utils/get-session"

export default function Layout({ children }: PropsWithChildren) {
  return (
    <>
      <SkipLinks
        links={[
          { label: "Menu", anchor: "#header-links" },
          { label: "Contenu", anchor: "#intention-content-container" },
          { label: "Pied de page", anchor: "#footer-links" },
        ]}
      />
      <Suspense fallback={<PublicHeaderStatic />}>
        <IntentionHeaderWithUser />
      </Suspense>
      <Box role="main" sx={{ py: fr.spacing("10v") }} component="main" tabIndex={-1} id="intention-content-container">
        {children}
      </Box>
      <Footer />
    </>
  )
}

// Le header doit connaître l'utilisateur connecté : sinon il affiche un lien « Connexion » vers
// /espace-pro/authentification à un recruteur déjà authentifié, et le préchargement de ce lien
// déclenche une boucle de redirections 307 entre le proxy et l'espace pro (incident du 2026-09-02).
async function IntentionHeaderWithUser() {
  const { user } = await getSession()
  return <PublicHeader user={user} hideConnectionButton={false} />
}
