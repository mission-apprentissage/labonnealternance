import { fr } from "@codegouvfr/react-dsfr"
import { Box } from "@mui/material"
import Image from "next/image"

import { DsfrLink } from "@/components/dsfr/DsfrLink"

export const IntensionPageNavigation = () => {
  return (
    <Box sx={{ display: "flex", width: "80%", maxWidth: "800px", margin: "auto", pt: fr.spacing("4w") }}>
      <DsfrLink style={{ backgroundImage: "none" }} href="/">
        <Image src="/images/logo_LBA.svg" alt="" width={160} height={60} style={{ minWidth: "160px" }} />
      </DsfrLink>
      <Box sx={{ flexGrow: 1, minWidth: 8 }} />
      <DsfrLink style={{ backgroundImage: "none", textDecoration: "underline" }} href="/">
        Page d&apos;accueil La bonne alternance
      </DsfrLink>
    </Box>
  )
}
