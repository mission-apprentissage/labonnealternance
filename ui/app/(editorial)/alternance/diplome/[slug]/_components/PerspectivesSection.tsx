import { fr } from "@codegouvfr/react-dsfr"
import { Box, Typography } from "@mui/material"

import type { IDiplomeCarriere, IDiplomePerspectiveKpi } from "../_data/types"

import { SectionTitle } from "./SectionTitle"

export function PerspectivesSection({ title, kpis, carrieres }: { title: string; kpis: IDiplomePerspectiveKpi[]; carrieres: IDiplomeCarriere[] }) {
  return (
    <Box sx={{ mb: fr.spacing("8v"), px: { xs: fr.spacing("4v"), md: fr.spacing("8v") } }}>
      <SectionTitle title={title} />

      <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, gap: fr.spacing("4v"), mb: fr.spacing("8v") }}>
        {kpis.map((kpi) => (
          <Box
            key={kpi.label}
            sx={{
              flex: 1,
              textAlign: "center",
              p: fr.spacing("6v"),
              borderRadius: "8px",
              backgroundColor: fr.colors.decisions.background.alt.blueFrance.default,
            }}
          >
            <Box sx={{ mb: fr.spacing("2v") }}>
              <span className={fr.cx(kpi.icon as any)} aria-hidden="true" style={{ color: fr.colors.decisions.text.default.info.default, fontSize: "24px" }} />
            </Box>
            <Typography sx={{ fontWeight: 700, fontSize: "32px", color: fr.colors.decisions.text.default.info.default }}>{kpi.value}</Typography>
            <Typography sx={{ color: fr.colors.decisions.text.mention.grey.default }}>{kpi.label}</Typography>
          </Box>
        ))}
      </Box>

      <Typography sx={{ fontWeight: 700, mb: fr.spacing("4v") }}>Évolution de carrière type</Typography>
      <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, gap: fr.spacing("4v") }}>
        {carrieres.map((carriere) => (
          <Box
            key={carriere.periode}
            sx={{
              flex: 1,
              p: fr.spacing("6v"),
              borderRadius: "8px",
              boxShadow: "0 2px 6px 0 rgba(0, 0, 18, 0.16)",
              borderLeft: `4px solid ${fr.colors.decisions.text.default.info.default}`,
            }}
          >
            <Typography variant="caption" sx={{ color: fr.colors.decisions.text.default.info.default, fontWeight: 700, mb: fr.spacing("2v"), display: "block" }}>
              {carriere.periode}
            </Typography>
            <Typography sx={{ fontWeight: 700, mb: fr.spacing("1v") }}>{carriere.titre}</Typography>
            <Typography sx={{ color: fr.colors.decisions.text.default.info.default, fontWeight: 700, mb: fr.spacing("2v") }}>{carriere.salaire}</Typography>
            <Typography variant="caption" sx={{ color: fr.colors.decisions.text.mention.grey.default }}>
              {carriere.missions}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  )
}
