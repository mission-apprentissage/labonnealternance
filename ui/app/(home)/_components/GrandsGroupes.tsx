import { fr } from "@codegouvfr/react-dsfr"
import { Box, Container, Typography } from "@mui/material"
import Image from "next/image"

export const GrandsGroupes = () => (
  <Container sx={{ padding: { xs: fr.spacing("6v"), lg: "0 !important" } }} maxWidth="xl" component="section">
    <Box>
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
        <Typography sx={{ width: "100%", fontSize: "18px", lineHeight: "28px" }}>
          La bonne alternance expose les offres d'emploi en alternance de nombreuses entreprises, dont :
        </Typography>

        <Box
          sx={{
            // display: "grid",
            // gridTemplateColumns: {
            //   xs: "repeat(2, 1fr)",
            //   md: "repeat(4, 1fr)",
            //   lg: "repeat(6, 1fr)",
            // },
            // gap: 0,
            display: "flex",
            flexWrap: "wrap",
          }}
        >
          <Image src="images/home_pics/logos_partenaires/decathlon.svg" alt="Logo de Décathlon" width={171} height={66} />
          <Image src="images/home_pics/logos_partenaires/loreal.svg" alt="Logo de L'Oréal" width={171} height={66} />
          <Image src="images/home_pics/logos_partenaires/engie.svg" alt="Logo d'Engie" width={171} height={66} />
          <Image src="images/home_pics/logos_partenaires/la-poste.svg" alt="Logo de La Poste" width={171} height={66} />
          <Image src="images/home_pics/logos_partenaires/auchan.svg" alt="Logo d'Auchan" width={171} height={66} />
          <Image src="images/home_pics/logos_partenaires/institut-pasteur.svg" alt="Logo de l'Institut Pasteur" width={171} height={66} />
          <Image src="images/home_pics/logos_partenaires/daher.svg" alt="Logo de Daher" width={171} height={66} />
        </Box>
      </Box>
    </Box>
  </Container>
)
