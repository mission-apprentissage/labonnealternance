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
  return (
    <html lang="en">
      <body>
        <Suspense fallback={<PublicHeaderStatic />}>
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
        <Footer />
      </body>
    </html>
  )
}

async function TestWidgetHeaderWithUser() {
  const { user } = await getSession()
  return <PublicHeader user={user} />
}
