import { Box, Heading, Image, Stack, Text } from "@chakra-ui/react"

import { J1S, Parcoursup } from "@/theme/components/logos"

export const InfosDiffusionOffre = () => {
  return (
    <Box border="1px solid #000091" p={5}>
      <Heading fontSize="24px" mb={3}>
        Profitez d'une visibilité accrue
      </Heading>
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
