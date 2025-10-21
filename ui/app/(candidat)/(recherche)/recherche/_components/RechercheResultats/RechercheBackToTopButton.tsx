"use client"

import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import { Box } from "@mui/material"

export function RechercheBackToTopButton({ onClick }: { onClick?: () => void }) {
  return (
    <Box
      sx={{
        position: "absolute",
        bottom: fr.spacing("4w"),
        width: "100%",
        "& button": {
          width: 44,
          height: 44,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        },
        "@media (max-width: 1440px)": {
          display: "none",
        },
        "& button:before": {
          marginRight: "0 !important",
          "--icon-size": "24px !important",
        },
      }}
    >
      <Box
        sx={{
          maxWidth: "xl",
          margin: "auto",
        }}
      >
        <Button
          onClick={onClick}
          iconId="fr-icon-arrow-up-line"
          style={{
            float: "right",
            marginRight: `calc(-46px - ${fr.spacing("4w")})`,
            fontSize: "16px",
          }}
        >
          {null}
        </Button>
      </Box>
    </Box>
  )
}
