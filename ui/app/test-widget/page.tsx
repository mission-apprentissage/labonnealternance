import { fr } from "@codegouvfr/react-dsfr"
import { Box } from "@mui/material"

import { ProtectedHeader } from "@/app/(espace-pro)/_components/ProtectedHeader"
import { Footer } from "@/app/_components/Footer"
import WidgetTester from "@/app/_components/WidgetTester"

export default function Page() {
  return (
    <html lang="en">
      <body>
        <ProtectedHeader />
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
