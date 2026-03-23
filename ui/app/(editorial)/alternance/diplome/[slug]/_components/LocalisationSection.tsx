import { fr } from "@codegouvfr/react-dsfr"
import { Box, Typography } from "@mui/material"
import Link from "next/link"
import { ArrowRightLine } from "@/theme/components/icons"
import type { IDiplomeVille } from "../_data/types"
import { SectionTitle } from "./SectionTitle"

export function LocalisationSection({ title, text, villes }: { title: string; text: string; villes: IDiplomeVille[] }) {
  return (
    <Box sx={{ mb: fr.spacing("8v"), px: { xs: fr.spacing("4v"), md: fr.spacing("8v") } }}>
      <SectionTitle title={title} description={text} />

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" }, gap: fr.spacing("4v") }}>
        {villes.map((ville) => (
          <Link key={ville.name} href={ville.href} style={{ textDecoration: "none" }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                p: fr.spacing("4v"),
                borderRadius: "8px",
                boxShadow: "0 2px 6px 0 rgba(0, 0, 18, 0.16)",
                "&:hover": { backgroundColor: fr.colors.decisions.background.default.grey.hover },
              }}
            >
              <Box>
                <Typography sx={{ fontWeight: 700, color: fr.colors.decisions.text.default.grey.default }}>{ville.name}</Typography>
                <Typography variant="caption" sx={{ color: fr.colors.decisions.text.mention.grey.default }}>
                  {ville.offres} offres disponibles
                </Typography>
              </Box>
              <ArrowRightLine sx={{ flexShrink: 0, color: fr.colors.decisions.text.default.info.default }} />
            </Box>
          </Link>
        ))}
      </Box>
    </Box>
  )
}
