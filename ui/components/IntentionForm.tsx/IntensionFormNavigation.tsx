import { Flex, Image, Link, Spacer } from "@chakra-ui/react"
import NextLink from "next/link"
import React from "react"

export const IntensionFormNavigation = () => {
  return (
    <Flex width="80%" maxWidth="800px" margin="auto" pt={12}>
      <NextLink legacyBehavior passHref href="/">
        <Link title="Retournez à la page d'accueil de La bonne alternance">
          <Image src="/images/logo_LBA.svg" alt="" minWidth="160px" width="160px" />
        </Link>
      </NextLink>
      <Spacer minWidth={8} />
      <NextLink legacyBehavior passHref href="/">
        <Link color="bluefrance.500" _hover={{ color: "bluefrance.500", textDecoration: "underline" }}>
          Page d&apos;accueil La bonne alternance
        </Link>
      </NextLink>
    </Flex>
  )
}
