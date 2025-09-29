import { fr } from "@codegouvfr/react-dsfr"
import { Box, Container } from "@mui/material"

import { IRechercheMode, parseRecherchePageParams } from "@/app/(candidat)/(recherche)/recherche/_utils/recherche.route.utils"
import { PromoRessources } from "@/app/(espace-pro)/_components/promoRessources"
import { AlgoHome } from "@/app/(home)/_components/AlgoHome"
import { AmeliorerLBA } from "@/app/(home)/_components/AmeliorerLBA"
import { HomeCircleImageDecoration } from "@/app/(home)/_components/HomeCircleImageDecoration"
import { HomeRechercheForm } from "@/app/(home)/_components/HomeRechercheForm"
import { HowTo } from "@/app/(home)/_components/HowTo"

export default async function HomePage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const rechercheParams = parseRecherchePageParams(new URLSearchParams(await searchParams), IRechercheMode.DEFAULT)

  return (
    <Container
      component="main"
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: fr.spacing("8w"),
        marginTop: { xs: 0, lg: fr.spacing("4w") },
        marginBottom: fr.spacing("8w"),
        px: { xs: 0, lg: fr.spacing("2w") },
      }}
      maxWidth="xl"
    >
      <Box
        component="section"
        sx={{
          position: "relative",
          borderRadius: { xs: 0, lg: fr.spacing("1w") },
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
          <HomeCircleImageDecoration />
        </Box>
        <Box sx={{ position: "relative", display: "grid", padding: { xs: 0, md: fr.spacing("6w") }, gap: fr.spacing("4w"), gridTemplateColumns: "1fr" }}>
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
