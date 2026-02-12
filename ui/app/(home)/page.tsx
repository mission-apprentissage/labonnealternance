import { fr } from "@codegouvfr/react-dsfr"
import { Box, Container } from "@mui/material"

import type { Metadata } from "next"
import { AlgoHome } from "./_components/AlgoHome"
import { AmeliorerLBA } from "./_components/AmeliorerLBA"
import { HomeCircleImageDecoration } from "./_components/HomeCircleImageDecoration"
import { HomeRechercheForm } from "./_components/HomeRechercheForm"
import { HowTo } from "./_components/HowTo"
import { PromoRessources } from "@/app/(espace-pro)/_components/promoRessources"
import { IRechercheMode, parseRecherchePageParams } from "@/app/(candidat)/(recherche)/recherche/_utils/recherche.route.utils"

export const metadata: Metadata = {
  title: "La bonne alternance - Trouvez votre alternance",
}

export default async function HomePage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const rechercheParams = parseRecherchePageParams(new URLSearchParams(await searchParams), IRechercheMode.DEFAULT)

  return (
    <Container
      component="main"
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: fr.spacing("16v"),
        marginTop: { xs: 0, lg: fr.spacing("8v") },
        marginBottom: fr.spacing("16v"),
        px: { xs: 0, lg: fr.spacing("4v") },
      }}
      maxWidth="xl"
      role="main"
    >
      <Box
        component="section"
        sx={{
          position: "relative",
          borderRadius: { xs: 0, lg: fr.spacing("2v") },
          backgroundColor: fr.colors.decisions.background.alt.grey.default,
        }}
      >
        <Box
          sx={{
            display: {
              xs: "none",
              md: "block",
            },
          }}
        >
          <HomeCircleImageDecoration size="high" />
        </Box>
        <Box sx={{ position: "relative", display: "grid", padding: { xs: 0, md: fr.spacing("12v") }, gap: fr.spacing("8v"), gridTemplateColumns: "1fr" }}>
          <HomeRechercheForm rechercheParams={rechercheParams} />
          <HowTo />
        </Box>
      </Box>

      <AlgoHome />
      <AmeliorerLBA />
      <PromoRessources target="candidat" />
    </Container>
  )
}
