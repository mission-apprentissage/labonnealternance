import { fr } from "@codegouvfr/react-dsfr"
import { Box } from "@mui/material"

import type { Metadata } from "next"
import { Suspense } from "react"
import { Footer } from "@/app/_components/Footer"
import { PublicHeader, PublicHeaderStatic } from "@/app/_components/PublicHeader"
import { WidgetTester } from "@/app/_components/WidgetTester"
import { getSession } from "@/utils/get-session"

export const metadata: Metadata = {
  title: "Formulaire de test des widgets - La bonne alternance",
}

export default function Page() {
  // Pas de <html>/<body> ici : le layout racine (app/layout.tsx) les rend déjà, et une seconde
  // paire imbriquée produit un document invalide. La langue est héritée de ce layout (lang="fr").
  return (
    <>
      <Suspense fallback={<PublicHeaderStatic zone="test-widget" />}>
        <TestWidgetHeaderWithUser />
      </Suspense>
      <Box
        sx={{
          maxWidth: "xl",
          margin: "auto",
          marginTop: fr.spacing("4v"),
        }}
      >
        <WidgetTester />
      </Box>
      <Footer zone="test-widget" />
    </>
  )
}

async function TestWidgetHeaderWithUser() {
  const { user } = await getSession()
  return <PublicHeader zone="test-widget" user={user} />
}
