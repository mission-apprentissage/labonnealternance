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
          { label: "Contenu", anchor: "#content-container" },
          { label: "Pied de page", anchor: "#footer-links" },
        ]}
      />
      <Suspense fallback={<PublicHeaderStatic />}>
        <DetailRendezVousHeaderWithUser />
      </Suspense>
      <Box id="content-container" sx={{ pt: fr.spacing("4v") }} tabIndex={-1} role="main" component="main">
        {children}
      </Box>
      <Footer />
    </>
  )
}

// Même garde-fou que sur formulaire-intention : ne pas afficher « Connexion » à un utilisateur
// connecté, sinon le préchargement du lien boucle sur le proxy (307 ↔ 307).
async function DetailRendezVousHeaderWithUser() {
  const { user } = await getSession()
  return <PublicHeader user={user} hideConnectionButton={false} />
}
