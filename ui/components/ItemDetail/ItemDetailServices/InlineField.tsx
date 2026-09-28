import { Box } from "@mui/material"
import type { ReactNode } from "react"

export const InlineField = ({ label, children }: { label: string; children: ReactNode }) => (
  <div>
    <Box component="dt" sx={{ display: "inline", fontWeight: 700, p: 0 }}>
      {label}
    </Box>{" "}
    <Box component="dd" sx={{ display: "inline", m: 0, p: 0 }}>
      {children}
    </Box>
  </div>
)
