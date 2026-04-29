import { fr } from "@codegouvfr/react-dsfr"
import Badge from "@codegouvfr/react-dsfr/Badge"
import Button from "@codegouvfr/react-dsfr/Button"
import { Box, Typography } from "@mui/material"
import Link from "next/link"
import { UTM_PARAMS } from "../_data/constants"
import type { IDiplomeEcoleCard } from "../_data/types"
import { SectionTitle } from "./SectionTitle"

function FormationCard({ card }: { card: IDiplomeEcoleCard }) {
  return (
    <Link href={`${card.href}?${UTM_PARAMS}`} style={{ textDecoration: "none", backgroundImage: "none", minWidth: 0 }}>
      <Box
        sx={{
          p: fr.spacing("4v"),
          border: `1px solid ${fr.colors.decisions.border.default.grey.default}`,
          borderRadius: "5px",
          backgroundColor: fr.colors.decisions.background.default.grey.default,
          display: "flex",
          flexDirection: "column",
          gap: fr.spacing("4v"),
          height: "100%",
          overflow: "hidden",
          boxShadow: "0 2px 6px 0 rgba(0, 0, 18, 0.16)",
          "&:hover": { backgroundColor: fr.colors.decisions.background.default.grey.hover },
        }}
      >
        <Badge severity="success">Formation</Badge>

        <Box sx={{ display: "flex", flexDirection: "column", gap: "6px", flex: 1 }}>
          <Typography sx={{ fontWeight: 700, fontSize: "16px", lineHeight: "24px", color: fr.colors.decisions.text.title.grey.default }}>{card.formationTitle}</Typography>
          <Typography
            sx={{
              fontSize: "14px",
              lineHeight: "24px",
              color: fr.colors.decisions.text.title.grey.default,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {card.etablissement}
          </Typography>
          <Typography sx={{ fontSize: "12px", lineHeight: "20px", color: fr.colors.decisions.text.title.grey.default }}>{card.lieu}</Typography>
        </Box>

        <Box sx={{ display: "flex", justifyContent: "flex-end", pt: fr.spacing("2v") }}>
          <span className={fr.cx("fr-icon-arrow-right-line" as any)} aria-hidden="true" style={{ color: fr.colors.decisions.background.actionHigh.blueFrance.default }} />
        </Box>
      </Box>
    </Link>
  )
}

export function EcolesSection({ title, titleHighlight, formations }: { title: string; titleHighlight?: string; formations: IDiplomeEcoleCard[] }) {
  return (
    <Box>
      <SectionTitle title={title} highlightedText={titleHighlight} />

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" },
          gap: fr.spacing("3v"),
          mb: fr.spacing("8v"),
        }}
      >
        {formations.map((card, index) => (
          <FormationCard key={`${card.formationTitle}-${index}`} card={card} />
        ))}
      </Box>

      <Box sx={{ textAlign: "center" }}>
        <Button priority="primary" size="large" iconId="fr-icon-arrow-right-line" iconPosition="right" linkProps={{ href: `/recherche-formation?${UTM_PARAMS}` }}>
          Voir toutes les formations
        </Button>
      </Box>
    </Box>
  )
}
