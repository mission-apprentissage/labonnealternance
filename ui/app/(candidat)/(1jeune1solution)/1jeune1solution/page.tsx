import { fr } from "@codegouvfr/react-dsfr"
import { Box, Container } from "@mui/material"
import NextImage from "next/image"
import { IRechercheMode, parseRecherchePageParams } from "@/app/(candidat)/(recherche)/recherche/_utils/recherche.route.utils"
import { HomeRechercheForm } from "@/app/(home)/_components/HomeRechercheForm"
import ciel from "@/public/images/1j1s/ciel.jpg"
import sparkLeft from "@/public/images/1j1s/sparks-left.svg"
import sparkRight from "@/public/images/1j1s/sparks-right.svg"

export default async function unJeune1Solution({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
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
        pt: { xs: fr.spacing("6v"), sm: 0 },
      }}
      maxWidth="xl"
      role="main"
    >
      <Box
        component="section"
        sx={{
          position: "relative",
          borderRadius: { xs: 0, lg: fr.spacing("2v") },
        }}
      >
        <Box>
          <NextImage
            fetchPriority="low"
            src={ciel.src}
            alt=""
            width={ciel.width}
            height={ciel.height}
            unoptimized
            style={{
              overflow: "visible",
              height: "calc(100% - 10px)",
              width: "100%",
              top: "20px",
              position: "absolute",
              objectFit: "cover",
            }}
          />

          <Box
            sx={{
              overflow: "visible",
              top: { xs: "-10px", lg: "-20px" },
              left: { xs: "10px", lg: "-20px" },
              position: "absolute",
            }}
          >
            <NextImage fetchPriority="low" src={sparkLeft.src} alt="" width={sparkLeft.width} height={sparkLeft.height} unoptimized />
          </Box>
          <Box
            sx={{
              overflow: "visible",
              bottom: { xs: "-10px", lg: "-20px" },
              right: { xs: "10px", lg: "-20px" },
              position: "absolute",
            }}
          >
            <NextImage fetchPriority="low" src={sparkRight.src} alt="" width={sparkRight.width} height={sparkRight.height} unoptimized />
          </Box>
        </Box>
        <Box
          sx={{
            position: "relative",
            display: "grid",
            paddingY: { xs: fr.spacing("8v"), md: fr.spacing("12v") },
            paddingX: { xs: fr.spacing("4v"), md: fr.spacing("8v") },
            gap: fr.spacing("8v"),
            gridTemplateColumns: "1fr",
          }}
        >
          <HomeRechercheForm rechercheParams={rechercheParams} />
        </Box>
      </Box>
    </Container>
  )
}
