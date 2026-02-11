import { Box, Typography } from "@mui/material"
import type { ReactNode } from "react"

export const Section = ({ title, children }: { title?: string; children: ReactNode }) => (
  <Box gap={2} display={"flex"} flexDirection={"column"}>
    {title && (
      <Typography component="h2" variant="h2" gutterBottom>
        {title}
      </Typography>
    )}
    {children}
  </Box>
)
