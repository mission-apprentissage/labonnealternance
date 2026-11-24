import { Box, Typography } from "@mui/material"
import Image from "next/image"

const LOGOS = [
  { src: "/images/home_pics/logos_partenaires/decathlon.svg", alt: "Logo de Décathlon" },
  { src: "/images/home_pics/logos_partenaires/loreal.svg", alt: "Logo de L'Oréal" },
  { src: "/images/home_pics/logos_partenaires/engie.svg", alt: "Logo d'Engie" },
  { src: "/images/home_pics/logos_partenaires/la-poste.svg", alt: "Logo de La Poste" },
  { src: "/images/home_pics/logos_partenaires/auchan.svg", alt: "Logo d'Auchan" },
  { src: "/images/home_pics/logos_partenaires/institut-pasteur.svg", alt: "Logo de l'Institut Pasteur" },
  { src: "/images/home_pics/logos_partenaires/daher.svg", alt: "Logo de Daher" },
]

export const LogosList = ({ logos }: { logos: { src: string; alt: string }[] }) => (
  <Box
    component="ul"
    className="fr-raw-list"
    sx={{
      display: "flex",
      flexWrap: "wrap",
    }}
  >
    {logos.map((logo) => (
      <Box component="li" key={logo.src} sx={{ display: "flex" }}>
        <Image src={logo.src} alt={logo.alt} width={171} height={66} />
      </Box>
    ))}
  </Box>
)

export const GrandsGroupes = () => (
  <>
    <Typography sx={{ width: "100%", fontSize: "18px", lineHeight: "28px" }}>
      La bonne alternance expose les offres d'emploi en alternance de nombreuses entreprises, dont :
    </Typography>

    <LogosList logos={LOGOS} />
  </>
)
