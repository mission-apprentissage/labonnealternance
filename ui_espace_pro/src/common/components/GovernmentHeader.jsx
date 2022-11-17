import { Box, Flex, Link, Spacer, Text } from "@chakra-ui/react"
import { ArrowForwardIcon } from "@chakra-ui/icons"
import GovernmentLogo from "./GovernmentLogo"

/**
 * @description Government header.
 * @returns {JSX.Element}
 */
const GovernmentHeader = () => (
  <Flex bg="#ffffff" boxShadow="0px 16px 16px -16px rgba(0, 0, 0, 0.32), 0px 8px 16px rgba(0, 0, 0, 0.1);" py={2}>
    <Box w="130px" />
    <Spacer />
    <Box w="180px">
      <GovernmentLogo width={150} />
    </Box>
    <Box w="700px" px={5} pt={5}>
      <Text textStyle="h2" color="grey.800" fontWeight="700" fontSize="20px" lineHeight="28px">
        RDV Apprentissage
      </Text>
      <Text color="grey.700" fontWeight="400" fontSize="14px" lineHeight="24px">
        Mise en relation entre les candidats à l'apprentissage et les CFA
      </Text>
    </Box>
    <Box w="320px" textAlign="center" pt={8}>
      <Link
        variant="basic"
        fontWeight="400"
        fontSize="14px"
        lineHeight="24px"
        href="https://mission-apprentissage.gitbook.io/rendez-vous-apprentissage-inscription/"
        target="_blank"
      >
        En savoir plus sur RDV apprentissage <ArrowForwardIcon />
      </Link>
    </Box>
    <Spacer />
    <Box w="130px" />
  </Flex>
)

export default GovernmentHeader
