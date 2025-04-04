import { fr } from "@codegouvfr/react-dsfr"
import { Box } from "@mui/material"

import { PublicHeader } from "@/app/(espace-pro)/_components/PublicHeader"
import { Footer } from "@/app/_components/Footer"
import WidgetTester from "@/app/_components/WidgetTester"
import { getSession } from "@/utils/getSession"

export default async function Page() {
  const { user } = await getSession()

  return (
    <html lang="en">
      <body>
        <PublicHeader user={user} />
        <Box
          maxWidth="xl"
          margin="auto"
          sx={{
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
