import { fr } from "@codegouvfr/react-dsfr"
import { Box, Typography } from "@mui/material"
import { SectionTitle } from "@/app/_components/Title/SectionTitle"
import { GrandsGroupes, LogosList } from "@/app/(home)/_components/GrandsGroupes"
import { GrandsGroupesLink } from "@/app/(home)/_components/GrandsGroupesLink"

const LOGOS_PARTENAIRES = [
  { src: "/images/home_pics/logos_partenaires/ft.svg", alt: "Logo de France Travail" },
  { src: "/images/home_pics/logos_partenaires/ep.svg", alt: "Logo de L'OPCO EP" },
  { src: "/images/home_pics/logos_partenaires/pass.svg", alt: "Logo de Pass" },
  { src: "/images/home_pics/logos_partenaires/job-teaser.svg", alt: "Logo de Jobteaser" },
  { src: "/images/home_pics/logos_partenaires/hw.svg", alt: "Logo de HelloWork" },
  { src: "/images/home_pics/logos_partenaires/talentplug.svg", alt: "Logo de Talentplug" },
  { src: "/images/home_pics/logos_partenaires/veritone.svg", alt: "Logo de Veritone" },
]

export const GrandsGroupesRecruteur = () => (
  <Box>
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: fr.spacing("10v"),
      }}
    >
      <SectionTitle id="ils-nous-font-confiance" highlight="confiance">
        Ils nous font
      </SectionTitle>
      <GrandsGroupes />

      <Typography sx={{ width: "100%", fontSize: "18px", lineHeight: "28px" }}>
        En plus des offres collectées directement auprès des recruteurs, La bonne alternance réunit sur un seul site les emplois en alternance issus de nombreux partenaires :
      </Typography>

      <LogosList logos={LOGOS_PARTENAIRES} />
    </Box>
    <GrandsGroupesLink />
  </Box>
)
