import { Box, Typography } from "@mui/material"

export const Section = ({ title, children }: { title?: string; children: React.ReactNode }) => (
  <Box gap={2} display={"flex"} flexDirection={"column"}>
    {title && (
      <Typography component="h2" variant="h2" gutterBottom>
        {title}
      </Typography>
    )}
    {children}
  </Box>
)
