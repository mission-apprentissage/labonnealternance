import { fr } from "@codegouvfr/react-dsfr"
import { Box, Typography } from "@mui/material"
import Link from "next/link"

import type { IDiplomeMetier } from "../_data/types"

import { SectionTitle } from "./SectionTitle"

export function MetiersSection({ title, text, liste }: { title: string; text: string; liste: IDiplomeMetier[] }) {
  return (
    <Box sx={{ mb: fr.spacing("8v"), px: { xs: fr.spacing("4v"), md: 0 } }}>
      <SectionTitle title={title} description={text} />

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" }, gap: fr.spacing("6v") }}>
        {liste.map((metier) => (
          <Box
            key={metier.title}
            sx={{
              p: fr.spacing("6v"),
              borderRadius: "5px",
              border: `1px solid ${fr.colors.decisions.border.default.grey.default}`,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
            }}
          >
            <Box sx={{ mb: fr.spacing("3v") }}>
              <span className={fr.cx(metier.icon as any)} aria-hidden="true" style={{ color: fr.colors.decisions.text.default.info.default, fontSize: "24px" }} />
            </Box>
            <Link
              href={metier.href}
              style={{
                fontWeight: 700,
                fontSize: "20px",
                lineHeight: "28px",
                color: fr.colors.decisions.text.default.info.default,
                textDecoration: "underline",
                marginBottom: fr.spacing("4v"),
                display: "block",
              }}
            >
              {metier.title}
            </Link>
            <Typography sx={{ fontSize: "18px", lineHeight: "28px", mb: fr.spacing("4v") }}>{metier.offres}</Typography>
            <Link href={metier.href} className={fr.cx("fr-link")} style={{ fontSize: "14px" }}>
              Voir les offres
            </Link>
          </Box>
        ))}
      </Box>
    </Box>
  )
}
