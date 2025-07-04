import { Box, SxProps } from "@mui/material"

const PageContainer = ({ children, sx }: { children: React.ReactNode; sx?: SxProps }) => {
  return <Box sx={{ mx: 2, ...sx }}>{children}</Box>
}

export default PageContainer
