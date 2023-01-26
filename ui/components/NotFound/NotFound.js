import { Box, Flex, Grid, GridItem, Image, Link, Text } from "@chakra-ui/react"
import lostCat from "public/images/lostCat.svg"
import React from "react"
import Footer from "../footer"

const NotFound = () => (
  <Flex direction="column" sx={{ minHeight: "100vh" }}>
    <Flex alignItems="center" flex={1} textAlign="center">
      <Grid templateColumns="repeat(2, 1fr)" gap={4}>
        <GridItem display="inline-grid" colSpan={{ base: 2, lg: 1 }} order={{ base: -1, lg: 1 }}>
          <Image src={lostCat} alt="" width="75%" />
        </GridItem>
        <GridItem display="inline-grid" colSpan={{ base: 2, lg: 1 }}>
          <Text as="h1" fontSize={{ base: "54px", md: "76px" }} mt={{ base: 4, md: 0 }}>
            404
          </Text>
          <Text fontSize={{ base: "16px", md: "18px" }} fontWeight={700}>
            Vous êtes perdu ?
          </Text>
          <Text fontSize={{ base: "14px", md: "18px" }}>
            Il semble que la page que vous essayez de rejoindre n&apos;existe pas. En cas de problème pour retrouver la page, essayez de repartir de la page d&apos;accueil en
            cliquant sur le lien ci-dessous.
          </Text>
          <Box mt={8} mb={{ base: 8, lg: 0 }}>
            <Link variant="postuler" href="https://labonnealternance.apprentissage.beta.gouv.fr" display="block" mb={2} mx="auto" width="50%">
              Page d&apos;accueil
            </Link>
          </Box>
        </GridItem>
      </Grid>
    </Flex>
    <Footer />
  </Flex>
)

export default NotFound
