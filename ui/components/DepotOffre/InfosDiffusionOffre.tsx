import { fr } from "@codegouvfr/react-dsfr"
import { Typography, Box } from "@mui/material"
import Image from "next/image"

import { BorderedBox } from "@/components/espace_pro/common/components/BorderedBox"
import { DsfrLink } from "@/components/dsfr/DsfrLink"
import { InfoCircle } from "@/theme/components/icons"

export const InfosDiffusionOffre = () => {
  return (
    <BorderedBox>
      <Typography variant="h4" sx={{ mb: fr.spacing("3w") }}>
        Profitez d'une visibilité accrue
      </Typography>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <InfoCircle sx={{ color: "#000091", width: "20px", height: "20px" }} />
        <Typography sx={{ mb: fr.spacing("3w") }}>Cela permettra à votre offre d’être visible des candidats intéressés.</Typography>
      </Box>
      <br />
      <Typography>
        Une fois créée, votre offre d’emploi sera immédiatement mise en ligne sur les sites suivants,&nbsp;
        <DsfrLink
          aria-label="Liste des partenaires - nouvelle fenêtre"
          href="https://mission-apprentissage.notion.site/Liste-des-partenaires-de-La-bonne-alternance-3e9aadb0170e41339bac486399ec4ac1"
        >
          et bien d’autres
        </DsfrLink>
        &nbsp;!
      </Typography>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: ["repeat(2, 1fr)", "repeat(2, 1fr)", "repeat(3, 1fr)", "repeat(3, 1fr)"],
          gap: 2,
          mt: fr.spacing("3w"),
          "& > *": {
            border: "solid 1px #DDDDDD",
            borderRadius: "3px",
            padding: "11px",
            height: "80px",
            width: "100%",
          },
        }}
      >
        <Image src="/images/logosPartenaires/minimal/1j1s.svg" height={80} width={100} alt="" />
        <Image src="/images/logosPartenaires/minimal/portail-alternance.svg" height={80} width={100} alt="" />
        <Image src="/images/logosPartenaires/minimal/affelnet.svg" height={80} width={200} alt="" />
        <Image src="/images/logosPartenaires/minimal/mon-master.svg" height={80} width={100} alt="" />
        <Image src="/images/logosPartenaires/minimal/parcoursup.svg" height={80} width={100} alt="" />
        <Image src="/images/logosPartenaires/minimal/france-travail.svg" height={80} width={100} alt="" />
      </Box>
    </BorderedBox>
  )
}
