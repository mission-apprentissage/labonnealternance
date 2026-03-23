import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import Tag from "@codegouvfr/react-dsfr/Tag"
import { Box, Typography } from "@mui/material"

import type { IDiplomeFormation } from "../_data/types"

import { SectionTitle } from "./SectionTitle"

export function FormationsSection({ title, niveaux }: { title: string; niveaux: IDiplomeFormation[] }) {
  return (
    <Box sx={{ mb: fr.spacing("8v"), px: { xs: fr.spacing("4v"), md: fr.spacing("8v") } }}>
      <SectionTitle title={title} />

      <Box sx={{ display: "flex", flexDirection: "column", gap: fr.spacing("4v") }}>
        {niveaux.map((formation) => (
          <Box
            key={formation.title}
            sx={{
              p: fr.spacing("6v"),
              borderRadius: "8px",
              boxShadow: "0 2px 6px 0 rgba(0, 0, 18, 0.16)",
            }}
          >
            <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, justifyContent: "space-between", alignItems: { md: "center" }, mb: fr.spacing("3v") }}>
              <Typography component="h3" sx={{ fontWeight: 700, fontSize: "20px" }}>
                {formation.title}
              </Typography>
              <Typography sx={{ color: fr.colors.decisions.text.default.info.default, fontWeight: 700 }}>{formation.formations} formations disponibles</Typography>
            </Box>

            <Box sx={{ display: "flex", flexWrap: "wrap", gap: fr.spacing("2v"), mb: fr.spacing("3v") }}>
              <Tag>{formation.duree}</Tag>
              <Tag>{formation.niveau}</Tag>
              <Tag>{formation.specialisation}</Tag>
            </Box>

            <Typography sx={{ color: fr.colors.decisions.text.mention.grey.default, mb: fr.spacing("3v") }}>
              <strong>Compétences :</strong> {formation.competences}
            </Typography>

            <Button priority="secondary" size="small" linkProps={{ href: "/recherche-formation" }}>
              Voir les formations
            </Button>
          </Box>
        ))}
      </Box>
    </Box>
  )
}
