import { fr } from "@codegouvfr/react-dsfr"
import { Box, Container } from "@mui/material"
import { SectionTitle } from "@/app/_components/Title/SectionTitle"
import { GrandsGroupes } from "@/app/(home)/_components/GrandsGroupes"
import { GrandsGroupesLink } from "@/app/(home)/_components/GrandsGroupesLink"

export const GrandsGroupesCandidat = () => (
  <Container sx={{ padding: { xs: fr.spacing("6v"), lg: "0 !important" } }} maxWidth="xl" component="section" aria-labelledby="grands-groupes-tpe">
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: fr.spacing("10v"),
      }}
    >
      <SectionTitle id="grands-groupes-tpe" highlight="aux TPE près de chez vous">
        Des grands groupes
      </SectionTitle>
      <GrandsGroupes intro="La bonne alternance réunit les offres de nombreuses entreprises, dont de grands groupes. Et parmi les entreprises que nous vous suggérons, 9 sur 10 sont des TPE ou des PME." />
    </Box>
    <GrandsGroupesLink />
  </Container>
)
