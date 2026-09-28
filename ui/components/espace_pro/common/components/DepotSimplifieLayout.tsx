import { fr } from "@codegouvfr/react-dsfr"
import { Box } from "@mui/material"
import type React from "react"

import WidgetLayout from "@/app/_components/Layout"

export const DepotSimplifieLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <WidgetLayout>
      <DepotSimplifieStyling>{children}</DepotSimplifieStyling>
    </WidgetLayout>
  )
}

export const DepotSimplifieStyling = ({ children }: { children: React.ReactNode }) => (
  <Box
    sx={{
      "& h2": {
        fontSize: ["16px", "16px", "16px", "24px"],
        lineHeight: ["24px", "24px", "24px", "32px"],
      },
      "& .bandeau": {
        marginBottom: fr.spacing("8v"),
      },
      "& .bandeau h2": {
        marginBottom: fr.spacing("2v"),
      },
      "& h2.big": {
        fontSize: ["18px", "20px", "20px", "32px"],
        lineHeight: ["28px", "32px", "32px", "40px"],
      },
      // :not([role="listbox"]) — cette mise en forme vise les listes de contenu. Sans l'exclusion,
      // elle s'applique aussi aux listbox des comboboxes (DropdownCombobox, AutocompleteAsync),
      // qui doivent être des <ul> pour rester valides (RGAA 8.2) : leurs options héritaient alors
      // de mx: 80px / mb: 40px et la liste déroulante devenait illisible.
      '& ul:not([role="listbox"])': {
        mx: 0,
        li: {
          fontSize: ["12px", "12px", "12px", "16px"],
          lineHeight: ["20px", "20px", "20px", "24px"],
          mx: fr.spacing("20v"),
          mb: fr.spacing("10v"),
        },
      },
      "& .fr-table td": {
        whiteSpace: "normal !important",
        wordWrap: "break-word",
        overflowWrap: "break-word",
      },
      "& .fr-table th": {
        whiteSpace: "normal !important",
        wordWrap: "break-word",
        overflowWrap: "break-word",
        background: "#F6F6F6",
        backgroundImage: "none !important",
        borderBottom: "1px solid #3c3c3c",
      },
      "& .fr-table__wrapper": {
        "--table-offset": "unset !important",
      },
    }}
  >
    {children}
  </Box>
)
