import { fr } from "@codegouvfr/react-dsfr"
import { Box, Typography } from "@mui/material"
import type { HeaderGroup } from "react-table"
import { ArrowDownLine } from "@/app/_components/ArrowDownLine"
import { ArrowUpDownLine } from "@/app/_components/ArrowUpDownLine"
import { ArrowUpLine } from "@/app/_components/ArrowUpLine"

/** État du tri porté par le `th`, comme dans VirtualTable (motif « tableau triable » de l'APG) : il n'est pas répété dans le nom du bouton. */
export const getColumnAriaSort = (column: Pick<HeaderGroup<any>, "canSort" | "isSorted" | "isSortedDesc">): "ascending" | "descending" | "none" | undefined => {
  if (!column.canSort) return undefined
  if (!column.isSorted) return "none"
  return column.isSortedDesc ? "descending" : "ascending"
}

/**
 * Contenu d'un en-tête de colonne react-table : libellé, et pour une colonne triable un bouton avec l'icône de tri
 * encadrée du DSFR. `sortLabel` nomme la colonne pour le tri quand `Header` n'est pas un texte.
 */
export const ColumnHeaderContent = ({ column }: { column: HeaderGroup<any> & { srOnly?: string; sortLabel?: string } }) => {
  const label = (
    // Le DSFR interdit le retour à la ligne dans les en-têtes : un libellé trop long pousserait l'icône de tri hors de la cellule.
    <Typography component="span" className={column.srOnly ? "fr-sr-only" : "fr-cell__title"} sx={{ fontSize: "14px", minWidth: 0, whiteSpace: "normal" }}>
      {column.srOnly ? column.srOnly : column.render("Header")}
    </Typography>
  )
  if (!column.canSort) {
    return <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center", width: "100%" }}>{label}</Box>
  }
  const { onClick } = column.getSortByToggleProps()

  return (
    <Box
      component="button"
      type="button"
      onClick={onClick}
      aria-label={`Trier par ${column.sortLabel || column.srOnly || column.Header}`}
      sx={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        width: "100%",
        background: "none",
        border: "none",
        padding: 0,
        cursor: "pointer",
        font: "inherit",
        color: "inherit",
        textAlign: "left",
        "&:focus-visible": {
          outline: "2px solid #0a76f6",
          outlineOffset: "2px",
        },
      }}
    >
      {label}
      <Box
        component="span"
        sx={{
          display: "flex",
          flexShrink: 0,
          ml: fr.spacing("2v"),
          p: "3px",
          border: "1px solid var(--border-default-grey)",
          borderRadius: "4px",
          "& .MuiIcon-root": { width: "1rem", height: "1rem", fontSize: "1rem", display: "flex" },
          "& .MuiIcon-root::before": { "--icon-size": "1rem" },
        }}
      >
        {column.isSorted ? column.isSortedDesc ? <ArrowDownLine /> : <ArrowUpLine /> : <ArrowUpDownLine />}
      </Box>
    </Box>
  )
}
