import { fr } from "@codegouvfr/react-dsfr"
import { Box, Typography } from "@mui/material"
import type { PropsWithChildren } from "react"

import { IconeLogo } from "../../../../theme/components/icons"

export const FormHeaderComponent = ({ children }: PropsWithChildren) => {
  return (
    <Box sx={{ backgroundColor: "#F9F8F6" }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          flexDirection: { xs: "column", sm: "column", md: "row" },
        }}
      >
        <Box
          sx={{
            flex: 1,
            ml: { xs: 0, sm: 0, md: fr.spacing("12w") },
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", sm: "column", md: "row" },
              mt: fr.spacing("2w"),
              mx: { xs: fr.spacing("2w"), sm: fr.spacing("2w"), md: 0 },
            }}
          >
            <Typography
              sx={{
                fontSize: "2rem",
                fontWeight: "bold",
                lineHeight: "2.5rem",
                color: "info.main",
              }}
            >
              {children}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ mr: fr.spacing("4w") }}>
          <IconeLogo sx={{ width: { xs: "0px", sm: "0px", md: "300px" }, height: { xs: "0px", sm: "0px", md: "174px" } }} />
        </Box>
      </Box>
    </Box>
  )
}
