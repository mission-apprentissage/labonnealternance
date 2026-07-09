import { fr } from "@codegouvfr/react-dsfr"
import { Box, Typography } from "@mui/material"
import Image from "next/image"
import { GrandsGroupes } from "@/app/(home)/_components/GrandsGroupes"
import { GrandsGroupesLink } from "@/app/(home)/_components/GrandsGroupesLink"

export const GrandsGroupesRecruteur = () => (
  <Box>
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: fr.spacing("10v"),
      }}
    >
      <Typography id="home-content-container" variant="h1">
        Ils nous font
        <br />
        <Box component="span" sx={{ color: fr.colors.decisions.border.default.blueFrance.default }}>
          confiance
        </Box>
      </Typography>
      <Box sx={{ width: "13%", minWidth: "80px", height: "4px", background: fr.colors.decisions.border.default.blueFrance.default }} />
      <GrandsGroupes />

      <Typography sx={{ width: "100%", fontSize: "18px", lineHeight: "28px" }}>
        En plus des offres collectées directement auprès des recruteurs, La bonne alternance réunit sur un seul site les emplois en alternance issus de nombreux partenaires :
      </Typography>

      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
        }}
      >
        <Image src="/images/home_pics/logos_partenaires/ft.svg" alt="Logo de France Travail" width={171} height={66} />
        <Image src="/images/home_pics/logos_partenaires/ep.svg" alt="Logo de L'OPCO EP" width={171} height={66} />
        <Image src="/images/home_pics/logos_partenaires/pass.svg" alt="Logo de Pass" width={171} height={66} />
        <Image src="/images/home_pics/logos_partenaires/job-teaser.svg" alt="Logo de Jobteaser" width={171} height={66} />
        <Image src="/images/home_pics/logos_partenaires/hw.svg" alt="Logo de HelloWork" width={171} height={66} />
        <Image src="/images/home_pics/logos_partenaires/talentplug.svg" alt="Logo de Talentplug" width={171} height={66} />
        <Image src="/images/home_pics/logos_partenaires/veritone.svg" alt="Logo de Veritone" width={171} height={66} />
      </Box>
    </Box>
    <GrandsGroupesLink />
  </Box>
)
