import { fr } from "@codegouvfr/react-dsfr"
import { Box, Typography } from "@mui/material"

import type { IDiplomeProgrammeSections } from "shared/models/seoDiplome.model"

import { SectionTitle } from "./SectionTitle"

const SECTION_CONFIG = [
  { key: "enseignements_generaux" as const, icon: "fr-icon-book-2-line", title: "Enseignements généraux" },
  { key: "enseignements_professionnels" as const, icon: "fr-icon-briefcase-line", title: "Enseignements professionnels" },
  { key: "competences_developpees" as const, icon: "fr-icon-award-line", title: "Compétences développées" },
]

function ProgrammeCard({ icon, title, items }: { icon: string; title: string; items: string[] }) {
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
        <span className={fr.cx(icon as any)} aria-hidden="true" style={{ color: "#000091" }} />
        <Typography component="h3" sx={{ fontWeight: 700, fontSize: "22px", lineHeight: "28px", color: "#000091" }}>
          {title}
        </Typography>
      </Box>
      <Box component="ul" sx={{ pl: fr.spacing("6v"), listStyleType: "disc" }}>
        {items.map((item) => (
          <Typography component="li" key={item} sx={{ fontSize: "18px", lineHeight: "28px" }}>
            {item}
          </Typography>
        ))}
      </Box>
    </Box>
  )
}

export function ProgrammeDiplome({ titre, text, sections }: { titre: string; text: string; sections: IDiplomeProgrammeSections }) {
  return (
    <Box sx={{ px: { xs: fr.spacing("4v"), md: 0 } }}>
      <SectionTitle title="Programme du diplôme" highlightedText={titre} />
      <Typography sx={{ mb: fr.spacing("6v"), fontSize: "18px", lineHeight: "28px" }}>{text}</Typography>

      <Box sx={{ display: "flex", flexDirection: "column", gap: fr.spacing("6v") }}>
        {/* Row 1: first 2 cards side by side */}
        <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, gap: fr.spacing("6v") }}>
          {SECTION_CONFIG.slice(0, 2).map((cfg) => (
            <ProgrammeCard key={cfg.key} icon={cfg.icon} title={cfg.title} items={sections[cfg.key]} />
          ))}
        </Box>

        {/* Row 2: remaining cards full width */}
        {SECTION_CONFIG.slice(2).map((cfg) => (
          <ProgrammeCard key={cfg.key} icon={cfg.icon} title={cfg.title} items={sections[cfg.key]} />
        ))}
      </Box>
    </Box>
  )
}
