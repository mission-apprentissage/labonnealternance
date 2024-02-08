import { Box, Center, Flex, Image, Link, Text } from "@chakra-ui/react"
import NextLink from "next/link"

const FonctionnementPlateforme = () => {
  return (
    <Flex align="center" p={6} mt={8} backgroundColor="#f6f6f6">
      <Center>
        <Box mr={6}>
          <Text as="div" mb={4}>
            Vous avez une question sur le fonctionnement de notre plateforme ?
          </Text>
          <NextLink legacyBehavior passHref href="/faq">
            <Link aria-label="Accès à la page FAQ" variant="basicUnderlinedBlue">
              Consulter la FAQ →
            </Link>
          </NextLink>
        </Box>
      </Center>
      <Image src="/images/pages_ressources/FAQ.svg" alt="" mr={4} aria-hidden="true" />
    </Flex>
  )
}

export default FonctionnementPlateforme
