import { Box, Typography } from "@mui/material"
import Image from "next/image"

export const GrandsGroupes = () => (
  <>
    <Typography sx={{ width: "100%", fontSize: "18px", lineHeight: "28px" }}>
      La bonne alternance expose les offres d'emploi en alternance de nombreuses entreprises, dont :
    </Typography>

    <Box
      sx={{
        display: "flex",
        flexWrap: "wrap",
      }}
    >
      <Image src="/images/home_pics/logos_partenaires/decathlon.svg" alt="Logo de Décathlon" width={171} height={66} />
      <Image src="/images/home_pics/logos_partenaires/loreal.svg" alt="Logo de L'Oréal" width={171} height={66} />
      <Image src="/images/home_pics/logos_partenaires/engie.svg" alt="Logo d'Engie" width={171} height={66} />
      <Image src="/images/home_pics/logos_partenaires/la-poste.svg" alt="Logo de La Poste" width={171} height={66} />
      <Image src="/images/home_pics/logos_partenaires/auchan.svg" alt="Logo d'Auchan" width={171} height={66} />
      <Image src="/images/home_pics/logos_partenaires/institut-pasteur.svg" alt="Logo de l'Institut Pasteur" width={171} height={66} />
      <Image src="/images/home_pics/logos_partenaires/daher.svg" alt="Logo de Daher" width={171} height={66} />
    </Box>
  </>
)
