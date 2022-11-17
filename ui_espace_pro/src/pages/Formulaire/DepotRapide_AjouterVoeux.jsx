import { Box, Container } from "@chakra-ui/react"
import { AjouterVoeux } from "../../components"

export default (props) => (
  <Container maxW="container.xl">
    <Box p={5}>
      <AjouterVoeux {...props} />
    </Box>
  </Container>
)
