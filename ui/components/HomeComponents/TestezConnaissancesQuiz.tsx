import { ArrowForwardIcon } from "@chakra-ui/icons"
import { Box, Container, Divider, Flex, Grid, GridItem, Image, Link, Text } from "@chakra-ui/react"
import hommeAuTelephone from "../../public/images/hommeAuTelephone.svg"
import fuseeDecollant from "../../public/images/fuseeDecollant.svg"
import hommeFemmeDiscutentAssisATable from "../../public/images/hommeFemmeDiscutentAssisATable.svg"
import femmeMontrantNavigateur from "../../public/images/femmeMontrantNavigateur.svg"

const gridGapY = 4
const gridGapX = [0, 0, 6, 6]

const Card = ({ title, linkText, linkUrl, imageUrl }: { title: string; linkText: string; linkUrl?: string; imageUrl: string }) => {
  return (
    <Flex height="100%" border="1px solid #E7E7E7" borderRadius="8px" py={6} px={8} background="beige" flexDirection={["column", "column", "column", "row"]}>
      <Image src={imageUrl} alt="" maxWidth={["100%", "100%", "100%", "30%"]} minWidth={["60%", "60%", "60%", "0%"]} mx="auto" />
      <Box flex={1} ml={6} mt={[4, 4, 4, 2]}>
        <Text as="p" lineHeight="32px" fontWeight={700} fontSize="24px" mb="5">
          {title}
        </Text>
        <Link
          variant="editorialContentLink"
          fontWeight={700}
          isExternal
          href={linkUrl}
          fontSize="14px"
          lineHeight="24px"
          display="flex"
          alignItems="center"
          justifyContent="flex-start"
        >
          {linkText}
          <ArrowForwardIcon color="info" marginLeft={2} />
        </Link>
      </Box>
    </Flex>
  )
}

const TestezConnaissancesQuiz = () => {
  return (
    <Container variant="responsiveContainer">
      <Text as="h2">
        <Text as="span" display="block" mb={1} variant="editorialContentH1" color="#2a2a2a">
          Testez vos connaissances
        </Text>
        <Text as="span" display="block" mb={1} variant="editorialContentH1">
          avec ces 4 quiz
        </Text>
      </Text>
      <Divider variant="pageTitleDivider" my={[4, 4, 8]} />
      <Grid templateColumns={{ base: "1fr", md: "repeat(12, 1fr)" }}>
        <GridItem colSpan={6} mr={gridGapX} mb={gridGapY}>
          <Card
            title="Vous recherchez votre formation ?"
            linkText="Préparez-vous à échanger avec une école"
            imageUrl={hommeAuTelephone}
            linkUrl="https://dinum.didask.com/courses/demonstration/60abc18c075edf000065c987"
          />
        </GridItem>
        <GridItem colSpan={6} mr={gridGapX} mb={gridGapY}>
          <Card
            title="Vous recherchez votre employeur ?"
            linkText="Apprenez à bien cibler les entreprises"
            imageUrl={femmeMontrantNavigateur}
            linkUrl="https://dinum.didask.com/courses/demonstration/60d21bf5be76560000ae916e"
          />
        </GridItem>
        <GridItem colSpan={6} mr={gridGapX} mb={gridGapY}>
          <Card
            title="Vous avez bientôt un entretien d’embauche ?"
            linkText="Entraînez-vous pour avoir plus de chances d'être retenu"
            imageUrl={hommeFemmeDiscutentAssisATable}
            linkUrl="https://dinum.didask.com/courses/demonstration/60d1adbb877dae00003f0eac"
          />
        </GridItem>
        <GridItem colSpan={6} mr={gridGapX} mb={gridGapY}>
          <Card
            title="Vous allez bientôt démarrer votre contrat ?"
            linkText="Familiarisez-vous avec la posture à adopter en entreprise"
            imageUrl={fuseeDecollant}
            linkUrl="https://dinum.didask.com/courses/demonstration/6283bd5ad9c7ae00003ede91"
          />
        </GridItem>
      </Grid>
    </Container>
  )
}

export default TestezConnaissancesQuiz
