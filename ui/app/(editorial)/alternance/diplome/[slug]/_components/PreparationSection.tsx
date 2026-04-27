import { fr } from "@codegouvfr/react-dsfr"
import { Box, Typography } from "@mui/material"
import Image from "next/image"
import Link from "next/link"

import DefaultContainer from "@/app/_components/Layout/DefaultContainer"

import { UTM_PARAMS } from "../_data/constants"
import type { IDiplomeRessource } from "../_data/types"

import { SectionTitle } from "./SectionTitle"

function RessourceCard({ ressource }: { ressource: IDiplomeRessource }) {
  return (
    <Link href={`${ressource.href}?${UTM_PARAMS}`} style={{ textDecoration: "none", flex: 1, backgroundImage: "none" }}>
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          height: { xs: "auto", md: "256px" },
          backgroundColor: fr.colors.decisions.background.default.grey.default,
          border: `1px solid ${fr.colors.decisions.border.default.grey.default}`,
          borderRadius: "5px",
          overflow: "hidden",
          "&:hover": { boxShadow: "0 2px 6px 0 rgba(0, 0, 18, 0.16)" },
        }}
      >
        {/* Illustration */}
        <Box
          sx={{
            position: "relative",
            width: { xs: "100%", md: "196px" },
            minHeight: { xs: "160px", md: "256px" },
            flexShrink: 0,
            backgroundColor: fr.colors.decisions.background.default.grey.hover,
          }}
        >
          {ressource.imageSrc && <Image src={ressource.imageSrc} alt="" fill style={{ objectFit: "cover", objectPosition: "center" }} sizes="(max-width: 768px) 100vw, 196px" />}
        </Box>
        {/* Content */}
        <Box sx={{ p: fr.spacing("8v"), display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <Typography component="h3" sx={{ fontWeight: 700, fontSize: "22px", lineHeight: "28px", color: fr.colors.decisions.text.title.grey.default, mb: fr.spacing("3v") }}>
            {ressource.title}
          </Typography>
          <Typography sx={{ fontSize: "14px", lineHeight: "24px", color: fr.colors.decisions.text.default.grey.default }}>{ressource.description}</Typography>
        </Box>
      </Box>
    </Link>
  )
}

export function PreparationSection({ titre, text, ressources }: { titre: string; text: string; ressources: IDiplomeRessource[] }) {
  return (
    <Box
      sx={{
        py: fr.spacing("12v"),
        backgroundColor: fr.colors.decisions.background.alt.blueFrance.default,
      }}
    >
      <DefaultContainer>
        <SectionTitle title="Comment se préparer à une alternance" highlightedText={`${titre} ?`} />
        <Typography sx={{ mb: fr.spacing("6v"), fontSize: "18px", lineHeight: "28px" }}>{text}</Typography>

        <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, gap: fr.spacing("6v") }}>
          {ressources.map((ressource) => (
            <RessourceCard key={ressource.title} ressource={ressource} />
          ))}
        </Box>
      </DefaultContainer>
    </Box>
  )
}
