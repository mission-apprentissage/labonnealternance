import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import { Box, Typography } from "@mui/material"

import type { IDiplomeEntreprise } from "../_data/types"

import { SectionTitle } from "./SectionTitle"

export function EntreprisesSection({ title, text, liste }: { title: string; text: string; liste: IDiplomeEntreprise[] }) {
  return (
    <Box sx={{ mb: fr.spacing("8v"), px: { xs: fr.spacing("4v"), md: fr.spacing("8v") } }}>
      <SectionTitle title={title} description={text} />

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2, 1fr)", md: "repeat(3, 1fr)" }, gap: fr.spacing("4v"), mb: fr.spacing("6v") }}>
        {liste.map((entreprise) => (
          <Box
            key={entreprise.name}
            sx={{
              p: fr.spacing("6v"),
              borderRadius: "8px",
              boxShadow: "0 2px 6px 0 rgba(0, 0, 18, 0.16)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
            }}
          >
            <Box
              sx={{
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                backgroundColor: fr.colors.decisions.background.default.grey.hover,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mb: fr.spacing("3v"),
              }}
            >
              <span className={fr.cx("fr-icon-building-line" as any)} aria-hidden="true" style={{ color: fr.colors.decisions.text.default.info.default }} />
            </Box>
            <Typography sx={{ fontWeight: 700, mb: fr.spacing("1v") }}>{entreprise.name}</Typography>
            <Typography variant="caption" sx={{ color: fr.colors.decisions.text.mention.grey.default }}>
              {entreprise.postes} postes en alternance
            </Typography>
          </Box>
        ))}
      </Box>

      <Box sx={{ textAlign: "center" }}>
        <Button priority="secondary" linkProps={{ href: "/recherche-emploi" }}>
          Voir toutes les entreprises
        </Button>
      </Box>
    </Box>
  )
}
