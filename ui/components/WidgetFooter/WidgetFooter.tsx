import { Box, Flex, Link, ListItem, UnorderedList } from "@chakra-ui/react"
import { default as NextLink } from "next/link"

import { LbaNew } from "../../theme/components/logos"

export const WidgetFooter = () => {
  return (
    <Flex
      paddingTop={30}
      paddingLeft={4}
      paddingRight={4}
      gap={30}
      paddingBottom={20}
      flexDirection={["column", "column", "column", "row"]}
      alignItems={["flex-start", "flex-start", "flex-start", "center"]}
    >
      <NextLink legacyBehavior passHref href="/" aria-label="Retour à l'accueil">
        <LbaNew w="143px" h="37px" />
      </NextLink>
      <Box as="p" flex={1}>
        <b>Le dépôt simplifié d'offre en alternance</b> est proposé par{" "}
        <NextLink legacyBehavior passHref href="/">
          <Link aria-label="Retour à l'accueil" textDecoration="underline">
            La bonne alternance
          </Link>
        </NextLink>
        . Il est développé par la{" "}
        <NextLink legacyBehavior passHref href="https://beta.gouv.fr/incubateurs/mission-apprentissage.html">
          <Link aria-label="Accès au site de la mission interministérielle pour l’apprentissage" textDecoration="underline">
            Mission interministérielle pour l’apprentissage
          </Link>
        </NextLink>
      </Box>
      <UnorderedList listStyleType="none" color="grey.425" fontSize={12} marginInlineStart={0}>
        <ListItem
          mt={{ base: 3, lg: 0 }}
          display={{ base: "inherit", lg: "inline-block" }}
          borderRight={{ base: "none", lg: "1px solid" }}
          borderRightColor={{ base: "none", lg: "grey.300" }}
          paddingRight={{ base: 0, lg: 4 }}
        >
          <NextLink legacyBehavior passHref href="/mentions-legales">
            <Link aria-label="Accès aux mentions légales">Mentions légales</Link>
          </NextLink>
        </ListItem>
        <ListItem
          mt={{ base: 3, lg: 0 }}
          display={{ base: "inherit", lg: "inline-block" }}
          borderRight={{ base: "none", lg: "1px solid" }}
          borderRightColor={{ base: "none", lg: "grey.300" }}
          paddingRight={{ base: 0, lg: 4 }}
          paddingLeft={{ base: 0, lg: 4 }}
        >
          <NextLink legacyBehavior passHref href="/cgu">
            <Link aria-label="Accès aux conditions générales d'utilisation">CGU</Link>
          </NextLink>
        </ListItem>
        <ListItem mt={{ base: 3, lg: 0 }} display={{ base: "inherit", lg: "inline-block" }} paddingRight={{ base: 0, lg: 4 }} paddingLeft={{ base: 0, lg: 4 }}>
          <NextLink legacyBehavior passHref href="/politique-de-confidentialite">
            <Link aria-label="Accès à la politique de confidentialité">Politique de confidentialité</Link>
          </NextLink>
        </ListItem>
      </UnorderedList>
    </Flex>
  )
}
