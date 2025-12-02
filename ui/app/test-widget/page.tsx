import { fr } from "@codegouvfr/react-dsfr"
import { Box } from "@mui/material"

import { Footer } from "@/app/_components/Footer"
import { PublicHeader } from "@/app/_components/PublicHeader"
import { WidgetTester } from "@/app/_components/WidgetTester"
import { getSession } from "@/utils/getSession"

export default async function Page() {
  const { user } = await getSession()

  return (
    <html lang="en">
      <body>
        <PublicHeader user={user} />
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
