import { Box, Flex, GridItem, Image, ListItem, SimpleGrid, Text, UnorderedList } from "@chakra-ui/react"
import { Link } from "@mui/material"

import { baseUrl } from "@/config/config"

const SuccesDesinscription = () => (
  <Box as="section" p={3} mb={{ base: "2", md: "0" }} backgroundColor="white">
    <Box border="1px solid" borderColor="bluefrance.500" padding={8} mb={8}>
      <Flex direction={{ base: "column", md: "row" }} align="center">
        <Image width="50%" maxWidth="250px" src="/images/home_pics/mail-in-clouds.svg" alt="" mb={{ base: 4, md: 0 }} mr={6} />
        <Box>
          <Text as="h1" mb={{ base: 2, md: 4 }} fontSize="24px" fontWeight={700}>
            Merci pour votre signalement.
          </Text>
          <Text fontSize="18px">Votre établissement vient d'être déréférencé du volet candidature spontanée de La bonne alternance.</Text>
        </Box>
      </Flex>
    </Box>
    <SimpleGrid columns={{ md: 1, lg: 3 }} spacing="40px" mb={12}>
      <GridItem colSpan={{ base: 1, lg: 2 }}>
        <Text fontSize="20px" fontWeight={700} mb={3}>
          En complément, permettez-nous de vous expliquer notre fonctionnement.
        </Text>
        <Text>
          La bonne alternance est un service public, porté par différents ministères (Emploi, Education Nationale, Transition numérique). Notre rôle est de faciliter les entrées en
          alternance
          <br />
          <br />
          Pour cela, nous exposons différents types d'entreprises :
        </Text>
        <UnorderedList mt={4}>
          <ListItem mb="3">
            Celles ayant diffusé une offre d'emploi sur notre{" "}
            <Link underline="hover" aria-label="Accéder au formulaire de dépôt simplifié de La bonne alternance" href={`${baseUrl}/acces-recruteur`}>
              formulaire de dépôt simplifié
            </Link>
          </ListItem>
          <ListItem mb="3">
            Celles ayant diffusé une offre d'emploi sur{" "}
            <Link aria-label="Accéder au site de France Travail - nouvelle fenêtre" underline="hover" target="_blank" rel="noopener noreferrer" href="https://www.francetravail.fr">
              France Travail
            </Link>{" "}
            ou ses{" "}
            <Link
              aria-label="Accéder au site de France Travail - nouvelle fenêtre"
              underline="hover"
              target="_blank"
              rel="noopener noreferrer"
              href="https://www.francetravail.fr/candidat/vos-services-en-ligne/des-partenaires-pour-vous-propos.html"
            >
              sites partenaires
            </Link>
          </ListItem>
          <ListItem mb="3">
            Celles n'ayant pas diffusé d'offres, mais ayant été identifiées comme "à fort potentiel d'embauche en alternance" grâce à l'analyse de diverses données publiques.
          </ListItem>
        </UnorderedList>
        <Text mt={4} fontWeight={700}>
          Votre établissement se situait dans la troisième catégorie.
        </Text>
        <Text>
          Pour cette raison, il était affiché sur La bonne alternance et vous receviez des candidatures spontanées en conséquence.
          <br />
          L'email ainsi que le numéro de téléphone référencés sur votre entreprise sont issus de votre espace recruteur France Travail.
        </Text>
        <Text mt={4}>
          Nous restons à votre disposition si vous souhaitez de nouveau être référencé sur La bonne alternance.
          <br />
          <br />
          Bien cordialement,
          <br />
          <br />
          L'équipe La bonne alternance
        </Text>
      </GridItem>
      <GridItem>
        <Box p={4} backgroundColor="#f5f5fe">
          <Flex align="center" mb={8}>
            <Image src="/images/icons/tete.svg" alt="" mr={4} />
            <Text fontSize="20px" fontWeight={700}>
              Le saviez-vous ?
            </Text>
          </Flex>

          <Text fontWeight={700} mb={4} fontSize="18px">
            Recruter un alternant présente de multiples avantages :
          </Text>

          <UnorderedList>
            <ListItem>Anticiper et former des salariés aux besoins de votre entreprise</ListItem>
            <ListItem>Répondre aux problématiques de recrutement en formant un vivier de candidats employables</ListItem>
            <ListItem>Disposer d'un regard nouveau et sensibilisé aux enjeux de demain</ListItem>
            <ListItem>
              <Link
                aria-label="Accès au site de simulation des aides au recrutement en alternance - nouvelle fenêtre"
                underline="hover"
                target="_blank"
                rel="noopener noreferrer"
                href="https://alternance.emploi.gouv.fr/simulateur-employeur/etape-1"
              >
                Profiter d'un financement gouvernemental
              </Link>
            </ListItem>
          </UnorderedList>
        </Box>
      </GridItem>
    </SimpleGrid>
  </Box>
)

export default SuccesDesinscription
