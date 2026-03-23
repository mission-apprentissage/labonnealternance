import { fr } from "@codegouvfr/react-dsfr"
import Badge from "@codegouvfr/react-dsfr/Badge"
import Button from "@codegouvfr/react-dsfr/Button"
import { Box, Typography } from "@mui/material"

import { SectionTitle } from "./SectionTitle"

export function OffresSection() {
  // TODO: Remplacer par de vraies offres via apiGet
  const placeholderOffres = Array.from({ length: 9 }, (_, i) => ({
    id: i,
    type: i < 6 ? "emploi" : "spontanee",
    title: i < 6 ? "Offre d'emploi en alternance" : "[raison sociale : nom de l'entreprise]",
    company: "Entreprise",
    location: "Ville",
  }))

  return (
    <Box sx={{ mb: fr.spacing("8v"), px: { xs: fr.spacing("4v"), md: 0 } }}>
      <SectionTitle title="Découvrez les XXX offres disponibles pour ce diplôme" />

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" }, gap: fr.spacing("4v"), mb: fr.spacing("8v") }}>
        {placeholderOffres.map((offre) => (
          <Box
            key={offre.id}
            sx={{
              p: fr.spacing("6v"),
              border: `1px solid ${fr.colors.decisions.border.default.grey.default}`,
              borderRadius: "5px",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <Box sx={{ display: "flex", gap: fr.spacing("2v"), mb: fr.spacing("3v"), flexWrap: "wrap" }}>
              {offre.type === "emploi" ? (
                <>
                  <Badge severity="info">Offre d&apos;emploi</Badge>
                  <Badge severity="info">La bonne alternance</Badge>
                </>
              ) : (
                <Badge severity="warning">Candidature spontanée</Badge>
              )}
            </Box>
            <Typography sx={{ fontWeight: 700, fontSize: "18px", lineHeight: "28px", mb: fr.spacing("2v") }}>{offre.title}</Typography>
            <Typography sx={{ fontSize: "14px", color: fr.colors.decisions.text.mention.grey.default, mb: fr.spacing("1v") }}>{offre.company}</Typography>
            <Typography sx={{ fontSize: "14px", color: fr.colors.decisions.text.mention.grey.default }}>{offre.location}</Typography>
          </Box>
        ))}
      </Box>

      <Box sx={{ textAlign: "center" }}>
        <Button priority="primary" size="large" linkProps={{ href: "/recherche-emploi" }}>
          Voir toutes les offres en alternance
        </Button>
      </Box>
    </Box>
  )
}
