import { fr } from "@codegouvfr/react-dsfr"
import { Box, Typography } from "@mui/material"
import Image from "next/image"

type StatCardProps = {
  icon: string
  value: string
  label: string
  source?: string
  /** `row` : pictogramme à gauche du chiffre, pour les grilles serrées. */
  layout?: "row" | "column"
}

export const StatCard = ({ icon, value, label, source, layout = "column" }: StatCardProps) => {
  const isRow = layout === "row"
  return (
    <Box
      component="li"
      sx={{
        display: isRow ? "grid" : "flex",
        gridTemplateColumns: isRow ? "48px minmax(0, 1fr)" : undefined,
        flexDirection: "column",
        alignItems: isRow ? "start" : "center",
        columnGap: fr.spacing("4v"),
        rowGap: fr.spacing("1v"),
        p: isRow ? fr.spacing("5v") : fr.spacing("7v"),
        textAlign: isRow ? "left" : "center",
        backgroundColor: fr.colors.decisions.background.default.grey.default,
        borderRadius: fr.spacing("1v"),
        boxShadow: "0 2px 6px 0 rgba(0, 0, 18, 0.16)",
      }}
    >
      <Image src={icon} alt="" width={isRow ? 48 : 64} height={isRow ? 48 : 64} style={isRow ? { gridRow: "1 / span 3" } : undefined} />
      <Typography component="p" sx={{ mb: 0, fontSize: isRow ? "24px" : "40px", lineHeight: isRow ? "32px" : "48px", fontWeight: 700, color: "#0063CB" }}>
        {value}
      </Typography>
      <Typography component="p" sx={{ mb: 0, fontSize: isRow ? "16px" : "20px", lineHeight: isRow ? "24px" : "28px", fontWeight: 700 }}>
        {label}
      </Typography>
      {source && (
        <Typography component="p" sx={{ mb: 0, fontSize: "12px", lineHeight: "18px" }}>
          {source}
        </Typography>
      )}
    </Box>
  )
}
