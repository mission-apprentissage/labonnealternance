import { fr } from "@codegouvfr/react-dsfr"
import { Box, Typography } from "@mui/material"

import type { IDiplomeProgramme } from "../_data/types"

import { SectionTitle } from "./SectionTitle"

function ProgrammeCard({ section }: { section: IDiplomeProgramme }) {
  return (
    <Box
      sx={{
        flex: 1,
        p: fr.spacing("6v"),
        backgroundColor: fr.colors.decisions.background.default.grey.default,
        border: `1px solid ${fr.colors.decisions.border.default.grey.default}`,
        borderRadius: "5px",
        display: "flex",
        flexDirection: "column",
        gap: fr.spacing("6v"),
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: fr.spacing("3v") }}>
        <span className={fr.cx(section.icon as any)} aria-hidden="true" style={{ color: "#000091" }} />
        <Typography component="h3" sx={{ fontWeight: 700, fontSize: "22px", lineHeight: "28px", color: "#000091" }}>
          {section.title}
        </Typography>
      </Box>
      <Box component="ul" sx={{ pl: fr.spacing("6v"), listStyleType: "disc" }}>
        {section.items.map((item) => (
          <Typography component="li" key={item} sx={{ fontSize: "18px", lineHeight: "28px" }}>
            {item}
          </Typography>
        ))}
      </Box>
    </Box>
  )
}

export function ProgrammeDiplome({ title, titleHighlight, text, sections }: { title: string; titleHighlight?: string; text: string; sections: IDiplomeProgramme[] }) {
  return (
    <Box sx={{ mb: fr.spacing("8v"), px: { xs: fr.spacing("4v"), md: 0 } }}>
      <SectionTitle title={title} highlightedText={titleHighlight} />
      <Typography sx={{ mb: fr.spacing("6v"), fontSize: "18px", lineHeight: "28px" }}>{text}</Typography>

      <Box sx={{ display: "flex", flexDirection: "column", gap: fr.spacing("6v") }}>
        {/* Row 1: 2 cards side by side */}
        <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, gap: fr.spacing("6v") }}>
          {sections.slice(0, 2).map((section) => (
            <ProgrammeCard key={section.title} section={section} />
          ))}
        </Box>

        {/* Row 2: remaining cards full width */}
        {sections.slice(2).map((section) => (
          <ProgrammeCard key={section.title} section={section} />
        ))}
      </Box>
    </Box>
  )
}
