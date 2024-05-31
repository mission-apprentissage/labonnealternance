import { Box, Container } from "@chakra-ui/react"

export enum EAdminPages {
  GESTION_RECRUTEURS = "GESTION_RECRUTEURS",
  ENTREPRISES_ALGO = "ENTREPRISES_ALGO",
}

const NavigationAdmin = ({ currentPage }) => {
  return (
    <Box
      sx={{
        boxShadow: "0px 1px 8px rgba(8, 67, 85, 0.24)",
      }}
    >
      <Container as="header" maxW="container.xl" flexGrow="1">
        BLA {currentPage}
      </Container>
    </Box>
  )
}

export default NavigationAdmin
