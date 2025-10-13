import { fr } from "@codegouvfr/react-dsfr"
import { Box } from "@mui/material"
import React from "react"

import WidgetLayout from "../../../../app/_components/Layout"

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
      my: fr.spacing("5w"),
      "& p": {
        fontSize: ["12px", "12px", "12px", "16px"],
        lineHeight: ["20px", "20px", "20px", "24px"],
        marginBottom: 0,
      },
      "& p.big": {
        fontSize: ["12px", "12px", "12px", "20px"],
        lineHeight: ["20px", "20px", "20px", "32px"],
      },
      "& h2": {
        fontSize: ["16px", "16px", "16px", "24px"],
        lineHeight: ["24px", "24px", "24px", "32px"],
      },
      "& .bandeau": {
        marginBottom: fr.spacing("4w"),
      },
      "& .bandeau h2": {
        marginBottom: fr.spacing("1w"),
      },
      "& h2.big": {
        fontSize: ["18px", "20px", "20px", "32px"],
        lineHeight: ["28px", "32px", "32px", "40px"],
      },
      "& ul": {
        mx: 0,
        li: {
          fontSize: ["12px", "12px", "12px", "16px"],
          lineHeight: ["20px", "20px", "20px", "24px"],
          mx: 10,
          mb: 5,
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
      },
      "& .fr-table": {
        "--table-offset": "unset",
      },
    }}
  >
    {children}
  </Box>
)
