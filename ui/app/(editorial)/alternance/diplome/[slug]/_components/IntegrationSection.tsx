import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import Tag from "@codegouvfr/react-dsfr/Tag"
import { Box, Typography } from "@mui/material"

import type { IDiplomeEtape, IDiplomePrerequis } from "../_data/types"

import { SectionTitle } from "./SectionTitle"

export function IntegrationSection({ title, prerequis, etapes }: { title: string; prerequis: IDiplomePrerequis[]; etapes: IDiplomeEtape[] }) {
  return (
    <Box sx={{ mb: fr.spacing("8v"), px: { xs: fr.spacing("4v"), md: 0 } }}>
      <SectionTitle title={title} />

      {/* Prérequis */}
      <Typography component="h3" sx={{ fontWeight: 700, fontSize: "24px", lineHeight: "32px", color: fr.colors.decisions.text.title.blueFrance.default, mb: fr.spacing("6v") }}>
        Prérequis
      </Typography>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: fr.spacing("3v"), mb: fr.spacing("8v") }}>
        {prerequis.map((p) => (
          <Tag key={p.label}>{p.label}</Tag>
        ))}
      </Box>

      {/* Les étapes pour réussir */}
      <Typography component="h3" sx={{ fontWeight: 700, fontSize: "24px", lineHeight: "32px", color: fr.colors.decisions.text.title.blueFrance.default, mb: fr.spacing("6v") }}>
        Les étapes pour réussir
      </Typography>
      <Box sx={{ display: "flex", flexDirection: "column", gap: fr.spacing("6v") }}>
        {etapes.map((etape) => (
          <Box key={etape.numero}>
            {/* Step header: number + title */}
            <Box sx={{ display: "flex", alignItems: "center", gap: fr.spacing("3v"), mb: fr.spacing("3v") }}>
              <Box
                sx={{
                  width: "34px",
                  height: "34px",
                  borderRadius: "50px",
                  backgroundColor: "#6A6AF4",
                  color: fr.colors.decisions.text.inverted.grey.default,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  fontSize: "20px",
                  lineHeight: "32px",
                  flexShrink: 0,
                }}
              >
                {etape.numero}
              </Box>
              <Typography sx={{ fontWeight: 700, fontSize: "20px", lineHeight: "32px" }}>{etape.title}</Typography>
            </Box>

            {/* Step description */}
            <Typography sx={{ fontSize: "18px", lineHeight: "28px", mb: fr.spacing("4v") }}>{etape.description}</Typography>

            {/* CTA button centered */}
            {etape.ctaLabel && etape.ctaHref && (
              <Box sx={{ display: "flex", justifyContent: "center" }}>
                <Button priority="primary" size="large" linkProps={{ href: etape.ctaHref }}>
                  {etape.ctaLabel}
                </Button>
              </Box>
            )}
          </Box>
        ))}
      </Box>
    </Box>
  )
}
