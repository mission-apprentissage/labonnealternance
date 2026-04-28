import { fr } from "@codegouvfr/react-dsfr"
import { Box, Typography } from "@mui/material"
import Link from "next/link"
import type { IDiplomeMetier } from "shared/models/seoDiplome.model"
import { UTM_PARAMS } from "../_data/constants"

import { SectionTitle } from "./SectionTitle"

export function MetiersSection({ titre, text, liste }: { titre: string; text: string; liste: IDiplomeMetier[] }) {
  const title = `Quels métiers exercer avec un diplôme ${titre} ?`
  return (
    <Box sx={{ px: { xs: fr.spacing("4v"), md: 0 } }}>
      <SectionTitle title={title} description={text} />

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" }, gap: fr.spacing("6v"), alignItems: "start" }}>
        {liste.map((metier) => (
          <Box
            key={metier.title}
            sx={{
              p: fr.spacing("6v"),
              borderRadius: "5px",
              border: `1px solid ${fr.colors.decisions.border.default.grey.default}`,
              boxShadow: "0 2px 6px 0 rgba(0, 0, 18, 0.16)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              gap: fr.spacing("6v"),
            }}
          >
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <span className={fr.cx(metier.icon as any)} aria-hidden="true" style={{ color: "#417DC4", fontSize: "24px" }} />
              <Typography sx={{ fontWeight: 700, fontSize: "24px", lineHeight: "32px", color: "#417DC4", textAlign: "center" }}>{metier.title}</Typography>
            </Box>
            <Typography sx={{ fontWeight: 700, fontSize: "22px", lineHeight: "28px", color: fr.colors.decisions.text.title.grey.default, textAlign: "center" }}>
              {metier.offres}
            </Typography>
            <Box sx={{ mt: "auto" }}>
              <Link
                href={`${metier.href}?${UTM_PARAMS}`}
                className={fr.cx("fr-link" as any, "fr-icon-arrow-right-line" as any, "fr-link--icon-right" as any)}
                style={{ fontSize: "16px" }}
              >
                Voir les offres
              </Link>
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  )
}
