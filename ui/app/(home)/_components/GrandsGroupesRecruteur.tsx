import { fr } from "@codegouvfr/react-dsfr"
import { Box, Container, Typography } from "@mui/material"
import Image from "next/image"
import Link from "next/link"
import { GrandsGroupes } from "@/app/(home)/_components/GrandsGroupes"
import { ArrowRightLine } from "@/theme/components/icons"
import { PAGES } from "@/utils/routes.utils"

export const GrandsGroupesRecruteur = () => (
  <Container maxWidth="xl" component="section">
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
          <Image src="images/home_pics/logos_partenaires/ft.svg" alt="Logo de France Travail" width={171} height={66} />
          <Image src="images/home_pics/logos_partenaires/ep.svg" alt="Logo de L'OPCO EP" width={171} height={66} />
          <Image src="images/home_pics/logos_partenaires/pass.svg" alt="Logo de Pass" width={171} height={66} />
          <Image src="images/home_pics/logos_partenaires/job-teaser.svg" alt="Logo de Jobteaser" width={171} height={66} />
          <Image src="images/home_pics/logos_partenaires/hw.svg" alt="Logo de HelloWork" width={171} height={66} />
          <Image src="images/home_pics/logos_partenaires/talentplug.svg" alt="Logo de Talentplug" width={171} height={66} />
          <Image src="images/home_pics/logos_partenaires/veritone.svg" alt="Logo de Veritone" width={171} height={66} />
        </Box>
      </Box>
      <Box sx={{ mt: fr.spacing("2v") }}>
        <Link href={`${PAGES.static.aPropos.getPath()}#nos-partenaires`} className={fr.cx("fr-link")}>
          Voir tous les partenaires{" "}
          <ArrowRightLine sx={{ flexShrink: 0, fontSize: "12px", color: fr.colors.decisions.background.actionHigh.blueFrance.default, ml: fr.spacing("1v") }} />
        </Link>
      </Box>
    </Box>
  </Container>
)
