import { fr } from "@codegouvfr/react-dsfr"
import { Box, Container, Grid } from "@mui/material"

import type { Metadata } from "next"
import { AppreciationUsagers } from "@/app/(home)/_components/AppreciationUsagers"
import { GrandsGroupesCandidat } from "@/app/(home)/_components/GrandsGroupesCandidat"
import { SchemaOrg } from "@/components/SchemaOrg"
import { METADATA } from "@/utils/routes.metadata.utils"
import { PAGES } from "@/utils/routes.utils"
import { AlgoHome } from "./_components/AlgoHome"
import { CalculRemuneration } from "./_components/CalculRemuneration"
import { HomeCircleImageDecoration } from "./_components/HomeCircleImageDecoration"
import { HomeRechercheOptIn } from "./_components/HomeRechercheOptIn"
import { HowTo } from "./_components/HowTo"
import { InformationsAlternance } from "./_components/InformationsAlternance"

export const metadata: Metadata = {
  title: METADATA.static.home().title,
  description: METADATA.static.home().description,
}

export default function HomePage() {
  return (
    <>
      <SchemaOrg
        type="WebPage"
        title={METADATA.static.home().title}
        description={METADATA.static.home().description}
        url={PAGES.static.home.getPath()}
        breadcrumbs={[{ name: PAGES.static.home.title, url: PAGES.static.home.getPath() }]}
      />
      {/* Nœuds site + organisation (émis uniquement sur la home) : c'est par eux que les
          moteurs et les IA identifient l'entité « La bonne alternance ». */}
      <SchemaOrg
        type="WebSite"
        title={METADATA.static.home().title}
        description={METADATA.static.home().description}
        url={PAGES.static.home.getPath()}
        breadcrumbs={[]}
        omitBreadcrumb
      />
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
              position: "absolute",
              top: "20px",
              width: "100%",
              display: {
                xs: "none",
                md: "block",
              },
            }}
          >
            <HomeCircleImageDecoration size="high" />
          </Box>
          <Box sx={{ position: "relative", display: "grid", padding: { xs: 0, md: fr.spacing("12v") }, gap: fr.spacing("8v"), gridTemplateColumns: "1fr" }}>
            <HomeRechercheOptIn />
            <HowTo />
          </Box>
        </Box>
        <Grid container spacing={fr.spacing("6v")}>
          <Grid size={{ md: 6, xs: 12 }}>
            <InformationsAlternance />
          </Grid>
          <Grid size={{ md: 6, xs: 12 }}>
            <CalculRemuneration />
          </Grid>
        </Grid>

        <GrandsGroupesCandidat />

        <Box sx={{ px: { xs: fr.spacing("6v"), lg: 0 } }}>
          <AppreciationUsagers realm="candidat" />
        </Box>

        <AlgoHome />
      </Container>
    </>
  )
}
