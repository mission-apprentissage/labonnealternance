import { SxProps, Container } from "@mui/material"

const DefaultContainer = ({ children, sx }: { children: React.ReactNode; sx?: SxProps }) => {
  return (
    <Container maxWidth="xl" sx={{ ...sx }}>
      {children}
    </Container>
  )
}

export default DefaultContainer
