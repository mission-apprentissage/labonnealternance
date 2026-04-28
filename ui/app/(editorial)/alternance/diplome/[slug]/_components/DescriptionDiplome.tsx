import { fr } from "@codegouvfr/react-dsfr"
import { Box, Typography } from "@mui/material"
import Image from "next/image"

import { SectionTitle } from "./SectionTitle"

export function DescriptionDiplome({ titre, text, objectifs }: { titre: string; text: string; objectifs: string[] }) {
  return (
    <Box sx={{ px: { xs: fr.spacing("4v"), md: 0 } }}>
      <SectionTitle title="Qu'est ce que le diplôme" highlightedText={`${titre} ?`} />
      <Typography sx={{ mb: fr.spacing("6v"), fontSize: "18px", lineHeight: "28px" }}>{text}</Typography>

      <Box
        sx={{
          p: fr.spacing("6v"),
          backgroundColor: fr.colors.decisions.background.default.grey.hover,
          borderRadius: "5px",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: fr.spacing("3v"), mb: fr.spacing("4v") }}>
          <Image src="/images/seo/diplome/icon-success.svg" alt="" width={60} height={60} aria-hidden="true" />
          <Typography component="h3" sx={{ fontWeight: 700, fontSize: "20px", lineHeight: "28px" }}>
            {"Objectifs du diplôme :"}
          </Typography>
        </Box>
        <Box component="ul" sx={{ pl: fr.spacing("6v"), listStyleType: "disc" }}>
          {objectifs.map((item) => (
            <Typography component="li" key={item} sx={{ fontSize: "20px", lineHeight: "32px" }}>
              {item}
            </Typography>
          ))}
        </Box>
      </Box>
    </Box>
  )
}
