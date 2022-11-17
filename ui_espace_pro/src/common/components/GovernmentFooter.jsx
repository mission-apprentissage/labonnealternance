import { Box, Flex, Link, Spacer, Text } from "@chakra-ui/react"
import GovernmentLogo from "./GovernmentLogo"

/**
 * @description Government header.
 * @returns {JSX.Element}
 */
const GovernmentFooter = () => (
  <Flex mt={40} py={8} borderTop="2px solid #000091">
    <Box w="130px" />
    <Spacer />
    <Box w="180px">
      <GovernmentLogo width={180} />
    </Box>
    <Spacer />
    <Box w="700px" pt={0}>
      <Text color="grey.700" fontWeight="400" fontSize="14px" lineHeight="24px">
        « RDV Apprentissage » est un module destiné à s’intégrer aux plateformes et portails exposant les formations en apprentissage pour faciliter le premier contact entre les
        candidats à l’apprentissage et les Centres de Formation des Apprentis (CFA)
      </Text>
      <Flex templateColumns="repeat(4, 1fr)" gap={1} fontWeight="bold" mt={3} fontSize="14px" lineHeight="24px">
        <Box flex="1">
          <Link target="_blank" href="https://legifrance.gouv.fr">
            legifrance.gouv.fr
          </Link>
        </Box>
        <Box flex="1">
          <Link target="_blank" href="https://gouvernement.fr">
            gouvernement.fr
          </Link>
        </Box>
        <Box flex="1">
          <Link target="_blank" href="https://service-public.fr">
            service-public.fr
          </Link>
        </Box>
        <Box flex="1">
          <Link target="_blank" href="https://data.gouv.fr">
            data.gouv.fr
          </Link>
        </Box>
      </Flex>
    </Box>
    <Spacer />
    <Box w="130px" />
  </Flex>
)

export default GovernmentFooter
