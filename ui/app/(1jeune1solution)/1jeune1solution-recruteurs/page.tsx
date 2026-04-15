import { fr } from "@codegouvfr/react-dsfr"
import { Box, Container, Typography } from "@mui/material"
import NextImage from "next/image"
import Social from "@/app/(1jeune1solution)/components/Social"

export default async function unJeune1Solution({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  return (
    <Container
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: fr.spacing("8v"),
        marginTop: { xs: 0, lg: fr.spacing("8v") },
        marginBottom: fr.spacing("16v"),
        px: { xs: 0, lg: fr.spacing("4v") },
        pt: { xs: fr.spacing("6v"), sm: 0 },
      }}
      maxWidth="xl"
    >
      <Box
        sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, gap: fr.spacing("6v"), px: { xs: fr.spacing("3v"), md: fr.spacing("6v"), lg: 0 }, py: fr.spacing("8v") }}
      >
        <Box sx={{ flex: 1 }}>
          <NextImage src="/images/1j1s/graph.svg" width={89} height={80} fetchPriority="low" alt="" unoptimized aria-hidden="true" />

          <Typography
            sx={{ background: "#FFE817", width: "fit-content", padding: "0", fontWeight: 800, fontSize: "50px", lineHeight: "60px", mt: fr.spacing("6v"), mb: fr.spacing("3v") }}
          >
            3,5 M
          </Typography>
          <Typography sx={{ background: "#FFE817", width: "fit-content", padding: "0", fontWeight: 800, lineHeight: "32px", fontSize: "20px", mb: fr.spacing("3v") }}>
            DE VISITEURS
          </Typography>
          <Typography sx={{ fontSize: "20px", lineHeight: "28px", fontWeight: 700 }}>Sur La bonne alternance en 2025</Typography>
        </Box>

        <Box sx={{ flex: 1 }}>
          <NextImage src="/images/1j1s/heart.svg" width={70} height={80} fetchPriority="low" alt="" unoptimized aria-hidden="true" />
          <Typography
            sx={{ background: "#FFE817", width: "fit-content", padding: "0", fontWeight: 800, fontSize: "50px", lineHeight: "60px", mt: fr.spacing("6v"), mb: fr.spacing("3v") }}
          >
            200 000
          </Typography>
          <Typography sx={{ background: "#FFE817", width: "fit-content", padding: "0", fontWeight: 800, lineHeight: "32px", fontSize: "20px", mb: fr.spacing("3v") }}>
            CANDIDATS
          </Typography>
          <Typography sx={{ fontSize: "20px", lineHeight: "28px", fontWeight: 700 }}>postulent aux offres chaque année</Typography>
        </Box>
        <Box sx={{ flex: 1 }}>
          <NextImage src="/images/1j1s/scroll.svg" width={71} height={80} fetchPriority="low" alt="" unoptimized aria-hidden="true" />
          <Typography
            sx={{ background: "#FFE817", width: "fit-content", padding: "0", fontWeight: 800, fontSize: "50px", lineHeight: "60px", mt: fr.spacing("6v"), mb: fr.spacing("3v") }}
          >
            30%
          </Typography>
          <Typography sx={{ background: "#FFE817", width: "fit-content", padding: "0", fontWeight: 800, lineHeight: "32px", fontSize: "20px", mb: fr.spacing("3v") }}>
            1 APPRENTI SUR 3
          </Typography>
          <Typography sx={{ fontSize: "20px", lineHeight: "28px", fontWeight: 700 }}>reste dans l'entreprise qui l'a formé</Typography>
        </Box>
      </Box>

      <Social />
    </Container>
  )
}
