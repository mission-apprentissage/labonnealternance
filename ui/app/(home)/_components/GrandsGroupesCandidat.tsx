import { fr } from "@codegouvfr/react-dsfr"
import { Box, Container, Typography } from "@mui/material"
import { GrandsGroupes } from "@/app/(home)/_components/GrandsGroupes"

export const GrandsGroupesCandidat = () => (
  <Container sx={{ padding: { xs: fr.spacing("6v"), lg: "0 !important" } }} maxWidth="xl" component="section">
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: fr.spacing("10v"),
      }}
    >
      <Typography id="home-content-container" variant="h1">
        Retrouvez les offres en alternance
        <br />
        <Box component="span" sx={{ color: fr.colors.decisions.border.default.blueFrance.default }}>
          de grands groupes
        </Box>
      </Typography>
      <Box sx={{ width: "13%", height: "4px", background: fr.colors.decisions.border.default.blueFrance.default }} />
      <GrandsGroupes />
    </Box>
  </Container>
)
