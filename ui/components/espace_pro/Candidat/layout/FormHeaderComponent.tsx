import { fr } from "@codegouvfr/react-dsfr"
import { Box, Typography } from "@mui/material"
import type { PropsWithChildren } from "react"

import { IconeLogo } from "@/theme/components/icons"

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
            ml: { xs: 0, sm: 0, md: fr.spacing("24v") },
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", sm: "column", md: "row" },
              mt: fr.spacing("4v"),
              mx: { xs: fr.spacing("4v"), sm: fr.spacing("4v"), md: 0 },
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
        <Box sx={{ mr: fr.spacing("8v") }}>
          <IconeLogo sx={{ width: { xs: "0px", md: "300px" }, height: { xs: "0px", md: "174px" } }} />
        </Box>
      </Box>
    </Box>
  )
}
