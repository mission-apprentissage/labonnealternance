import { Box, Flex } from "@chakra-ui/react"
import { UpdateAllParameterReferrers } from "../components/UpdateAllParameterReferrers"
import { BulkImport } from "../components/BulkImport"
import { ActivateAllCfaFormations } from "../components/ActivateAllCfaFormations"

const BulkPage = () => (
  <Box>
    <BulkImport />
    <Flex justifyContent="center" flexDirection={["column", "column", "row", "row"]} mx={[2]}>
      <UpdateAllParameterReferrers />
      <ActivateAllCfaFormations />
    </Flex>
    <Box height="5vh" />
  </Box>
)

export default BulkPage
