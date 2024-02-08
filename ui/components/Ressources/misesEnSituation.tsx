import { ExternalLinkIcon } from "@chakra-ui/icons"
import { Box, Center, Flex, Grid, GridItem, Image, Link, Text } from "@chakra-ui/react"

const boxProperties = {
  boxShadow: "0px 0px 12px 6px #79797966",
}

const miseEnSituation = ({ imageUrl, text, link, linkTitle }) => {
  return (
    <GridItem padding={6} style={boxProperties}>
      <Flex>
        <Image src={imageUrl} alt="" mr={4} aria-hidden="true" />
        <Center>
          <Box>
            <Text fontWeight={700} as="div">
              {text}
            </Text>
            <Link href={link} isExternal variant="basicUnderlinedBlue">
              {linkTitle}
              <ExternalLinkIcon mb="3px" ml="2px" />
            </Link>
          </Box>
        </Center>
      </Flex>
    </GridItem>
  )
}

const MisesEnSituation = ({ target }) => {
  const text = target === "candidat" ? "Entraînez-vous avec nos 4 parcours de mise en situation :" : "Proposez-leur de s’entraîner avec nos 3 parcours de mise en situation :"
  return (
    <>
      {text}
      <Grid my={6} templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={6}>
        {target === "candidat" &&
          miseEnSituation({
            imageUrl: "/images/pages_ressources/didask-module1.svg",
            text: "Vous recherchez votre formation ?",
            link: "https://dinum.didask.com/courses/demonstration/60abc18c075edf000065c987",
            linkTitle: "Préparez-vous à échanger avec une école",
          })}
        {miseEnSituation({
          imageUrl: "/images/pages_ressources/didask-module2.svg",
          text: "Vous recherchez votre employeur ?",
          link: "https://dinum.didask.com/courses/demonstration/60d21bf5be76560000ae916e",
          linkTitle: "Apprenez à bien cibler les entreprises",
        })}
        {miseEnSituation({
          imageUrl: "/images/pages_ressources/didask-module3.svg",
          text: "Vous avez bientôt un entretien d’embauche ?",
          link: "https://dinum.didask.com/courses/demonstration/60d1adbb877dae00003f0eac",
          linkTitle: "Entraînez-vous pour avoir plus de chances de réussite",
        })}
        {miseEnSituation({
          imageUrl: "/images/pages_ressources/didask-module4.svg",
          text: "Vous allez bientôt démarrer votre contrat ?",
          link: "https://dinum.didask.com/courses/demonstration/6283bd5ad9c7ae00003ede91",
          linkTitle: "Familiarisez-vous avec la posture à adopter en entreprise",
        })}
      </Grid>
    </>
  )
}
export default MisesEnSituation
