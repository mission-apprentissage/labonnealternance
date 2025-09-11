import { fr } from "@codegouvfr/react-dsfr"
import { Box, Typography } from "@mui/material"
import Image from "next/image"

import { DsfrLink } from "@/components/dsfr/DsfrLink"

export const AmeliorerLBA = () => (
  <Box
    component="section"
    sx={{
      display: "grid",
      gridTemplateColumns: { xs: "1fr", md: "2fr 3fr" },
      padding: fr.spacing("6w"),
      gap: fr.spacing("6w"),
      backgroundColor: fr.colors.decisions.background.alt.blueFrance.default,
      borderRadius: "10px",
    }}
  >
    <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
      <Image src="/images/home_pics/illu-support.svg" alt="" unoptimized width={422} height={244} />
    </Box>
    <Box sx={{ display: "flex", flexDirection: "column", gap: fr.spacing("3w") }}>
      <Typography variant="h2">
        Vous êtes une entreprise à la{" "}
        <Box component="span" sx={{ color: fr.colors.decisions.artwork.minor.blueFrance.default }}>
          recherche d’alternants ?
        </Box>
      </Typography>
      <Typography>
        Participez à une démonstration de La bonne alternance. Un <strong>service public gratuit pour publier facilement vos offres sur plusieurs plateformes</strong> : La bonne
        alternance, 1jeune1solution, Parcoursup, l'Onisep, et bien d'autres.
      </Typography>
      <Typography>
        <strong>Chaque semaine</strong>, nous organisons des webinaires spécialement conçus pour les recruteurs afin de vous présenter toutes les fonctionnalités de notre
        plateforme.
      </Typography>
      <Typography>
        <strong>Profitez-en pour poser vos questions en direct !</strong>, nous organisons des webinaires spécialement conçus pour les recruteurs afin de vous présenter toutes les
        fonctionnalités de notre plateforme.
      </Typography>

      <DsfrLink
        href="https://6809b65f.sibforms.com/serve/MUIFALs50AkvIVt1h1ylDrmeRlezs6vM7OgGdozzfuLa1JowHEjViCJ0Ki4qHf4b_p0tbxnozS4VFgGovYCsGOJPJaw69u31xa06qCg9oVHuE9ZFWMFZB8E8jMw5ljqJcwTVaJZhB72piifkEpXObvX-cjoE0aiAh5QXEZvCHCLEi1u7pvt5cjiG8sBK-LDLhuMwr1fIx_vEg0iz"
        aria-label="M'inscrire au webinaire - nouvelle fenêtre"
        size="lg"
        className={fr.cx("fr-btn", "fr-btn--lg", "fr-btn--secondary", "fr-btn--icon-right")}
      >
        M'inscrire au webinaire
      </DsfrLink>
    </Box>
  </Box>
)
