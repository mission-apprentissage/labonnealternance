import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import { Box, Typography } from "@mui/material"

import type { IDiplomeSalaireLigne } from "../_data/types"

import { SectionTitle } from "./SectionTitle"

export function SalaireSection({ title, texteIntro, lignes }: { title: string; texteIntro: string; lignes: IDiplomeSalaireLigne[] }) {
  const headerSx = {
    fontWeight: 700,
    p: fr.spacing("3v"),
    backgroundColor: fr.colors.decisions.background.default.grey.hover,
    fontSize: "14px",
    lineHeight: "24px",
  }

  const cellSx = {
    p: fr.spacing("3v"),
    borderBottom: `1px solid ${fr.colors.decisions.border.default.grey.default}`,
    fontSize: "14px",
    lineHeight: "24px",
  }

  return (
    <Box sx={{ mb: fr.spacing("8v"), px: { xs: fr.spacing("4v"), md: 0 } }}>
      <SectionTitle title={title} />
      <Typography sx={{ fontWeight: 700, fontSize: "18px", lineHeight: "28px", mb: fr.spacing("6v") }}>{texteIntro}</Typography>

      <Box sx={{ overflowX: "auto", mb: fr.spacing("8v") }}>
        <Box component="table" sx={{ width: "100%", borderCollapse: "collapse", minWidth: "500px" }}>
          <thead>
            <tr>
              <Box component="th" sx={{ ...headerSx, textAlign: "left" }}>
                Âge
              </Box>
              <Box component="th" sx={{ ...headerSx, textAlign: "center" }}>
                1ère année
              </Box>
              <Box component="th" sx={{ ...headerSx, textAlign: "center" }}>
                2ème année
              </Box>
            </tr>
          </thead>
          <tbody>
            {lignes.map((ligne) => (
              <tr key={ligne.age}>
                <Box component="td" sx={{ ...cellSx, fontWeight: 700 }}>
                  {ligne.age}
                </Box>
                <Box component="td" sx={{ ...cellSx, textAlign: "center" }}>
                  <Typography sx={{ fontSize: "14px" }}>{ligne.premiereAnnee}</Typography>
                </Box>
                <Box component="td" sx={{ ...cellSx, textAlign: "center" }}>
                  <Typography sx={{ fontSize: "14px" }}>{ligne.deuxiemeAnnee}</Typography>
                </Box>
              </tr>
            ))}
          </tbody>
        </Box>
      </Box>

      <Box sx={{ textAlign: "center" }}>
        <Button priority="primary" size="large" linkProps={{ href: "/simulateur-alternance" }}>
          Calculer ma rémunération en alternance
        </Button>
      </Box>
    </Box>
  )
}
