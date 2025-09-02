"use client"

import Button from "@codegouvfr/react-dsfr/Button"
import { Box, Typography } from "@mui/material"
import { useRouter } from "next/navigation"

import { BorderedBox } from "@/components/espace_pro/common/components/BorderedBox"
import { DepotSimplifieStyling } from "@/components/espace_pro/common/components/DepotSimplifieLayout"
import { InfoCircle } from "@/theme/components/icons"
import { MailCloud } from "@/theme/components/logos"
import { PAGES } from "@/utils/routes.utils"

export default function CompteEnAttente() {
  const router = useRouter()

  const redirectFn = () => router.push(PAGES.static.organismeDeFormation.getPath())

  return (
    <DepotSimplifieStyling>
      <BorderedBox sx={{ display: "flex", flexDirection: { xs: "column", lg: "row" }, gap: { xs: 1, lg: 2 }, justifyContent: "center", width: "100%", my: 2 }}>
        <MailCloud w={["120px", "120px", "120px", "269px"]} h={["67px", "67px", "67px", "151px"]} />
        <Box>
          <Typography component="h1" sx={{ fontSize: "28px", mb: 3, fontWeight: "bold", lineHeight: "28px" }}>
            Votre demande d’accès est désormais en attente de validation.
          </Typography>
          <Box sx={{ display: "flex", alignItems: "flex-start", mb: 3 }}>
            <InfoCircle mr={2} mt={1} />
            <Typography>Vous serez notifié par email une fois votre compte validé, et vous pourrez ensuite publier vos offres d’emplois.</Typography>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", ml: 2, mb: 2 }}>
            <Button priority="secondary" onClick={redirectFn}>
              Retour à l'accueil
            </Button>
          </Box>
        </Box>
      </BorderedBox>
    </DepotSimplifieStyling>
  )
}
