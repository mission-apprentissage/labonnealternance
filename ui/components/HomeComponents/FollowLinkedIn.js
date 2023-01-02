import React from "react"

import { Text, Link, Image, Grid, GridItem } from "@chakra-ui/react"

const FollowLinkedIn = () => {
  return (
    <Grid as="section" py={6} bg="bluefrance.200" mb="24" templateColumns={{ base: "1fr", lg: "repeat(12, 1fr)" }} borderRadius={10}>
      <GridItem colSpan={{ base: 1, lg: 9 }} ml={{ base: 2, lg: 6 }}>
        <Text as="p" size="16px" fontWeight={700}>
          La mission interministérielle pour l’apprentissage et les trajectoires professionnelles construit des services numériques qui facilitent les entrées en apprentissage.
        </Text>
        <Text fontWeight={700} color="bluefrance.500" fontSize={32} pt={2}>
          Rendez-vous sur LinkedIn pour suivre nos actualités
        </Text>
      </GridItem>
      <GridItem mt="4" colSpan={{ base: 1, lg: 3 }} display="flex" justifyContent="center" alignItems="center">
        <Link
          href="https://www.linkedin.com/company/mission-apprentissage/posts/?feedView=all"
          aria-label="Accès à la page Linkedin de la mission interministérielle pour l’apprentissage et les trajectoires professionnelles"
          bg="bluefrance.500"
          color="white"
          width={209}
          display="flex"
          justifyContent="center"
          py={4}
          fontSize={18}
          isExternal
          _hover={{ color: "white", textDecoration: "underline" }}
        >
          Voir notre page &nbsp;
          <Image src="/images/icons/linkedin.svg" alt=""></Image>
        </Link>
      </GridItem>
    </Grid>
  )
}

export default FollowLinkedIn
