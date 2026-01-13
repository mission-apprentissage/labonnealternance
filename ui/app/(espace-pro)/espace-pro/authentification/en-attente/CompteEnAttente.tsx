"use client"

import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import { Box, Typography } from "@mui/material"
import Image from "next/image"
import { useRouter } from "next/navigation"

import { BorderedBox } from "@/components/espace_pro/common/components/BorderedBox"
import { DepotSimplifieStyling } from "@/components/espace_pro/common/components/DepotSimplifieLayout"
import { InfoCircle } from "@/theme/components/icons"
import { PAGES } from "@/utils/routes.utils"

export default function CompteEnAttente() {
  const router = useRouter()

  const redirectFn = () => router.push(PAGES.static.organismeDeFormation.getPath())

  return (
    <DepotSimplifieStyling>
      <BorderedBox sx={{ display: "flex", flexDirection: { xs: "column", lg: "row" }, gap: { xs: 1, lg: 2 }, justifyContent: "center", width: "100%", my: fr.spacing("1w") }}>
        <Image src="/images/espace_pro/mailcloud.svg" width="269" height="151" alt="" />
        <Box>
          <Typography component="h1" sx={{ fontSize: "28px", mb: fr.spacing("6v"), fontWeight: "bold", lineHeight: "28px" }}>
            Votre demande d’accès est désormais en attente de validation.
          </Typography>
          <Box sx={{ display: "flex", alignItems: "flex-start", mb: fr.spacing("6v") }}>
            <InfoCircle sx={{ mr: fr.spacing("1w"), mt: fr.spacing("1v") }} />
            <Typography>Vous serez notifié par email une fois votre compte validé, et vous pourrez ensuite publier vos offres d’emplois.</Typography>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", ml: fr.spacing("4v"), mb: fr.spacing("4v") }}>
            <Button priority="secondary" onClick={redirectFn}>
              Retour à l'accueil
            </Button>
          </Box>
        </Box>
      </BorderedBox>
    </DepotSimplifieStyling>
  )
}
