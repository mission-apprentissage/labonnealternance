import { Box, Flex, Heading, Image, Stack, Text } from "@chakra-ui/react"

import { InfoCircle } from "@/theme/components/icons"
import { J1S, Parcoursup } from "@/theme/components/logos_pro"

export const InfosDiffusionOffre = () => {
  return (
    <Box border="1px solid #000091" p={5}>
      <Heading fontSize="24px" mb={3}>
        Dites-nous en plus sur votre besoin en recrutement
      </Heading>
      <Flex alignItems="flex-start" mb={6} justify="flex-start">
        <InfoCircle mr={2} mt={1} color="bluefrance.500" />
        <Text textAlign="justify">Cela permettra à votre offre d'être visible des candidats intéressés.</Text>
      </Flex>
      <Box ml={5}>
        <Text>Une fois créée, votre offre d’emploi sera immédiatement mise en ligne sur les sites suivants : </Text>
        <Stack direction={["column", "row"]} spacing={2} align="center" justify="center" mt={3}>
          <Image src="/images/logo_LBA.svg" alt="" minWidth="150px" width="150px" />
          <J1S w="100px" h="100px" />
          <Parcoursup w="220px" h="100px" />
        </Stack>
      </Box>
    </Box>
  )
}
