import { Typography } from "@mui/material"

export const Paragraph = ({ children, bold }: { children: React.ReactNode; bold?: boolean }) => (
  <Typography component="p" variant="body1" fontWeight={bold ? "bold" : "normal"}>
    {children}
  </Typography>
)
