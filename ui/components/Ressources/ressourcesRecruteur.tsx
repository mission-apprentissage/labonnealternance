import { ExternalLinkIcon } from "@chakra-ui/icons"
import { Box, Center, Flex, Grid, Image, Link, ListItem, Text, UnorderedList } from "@chakra-ui/react"
import NextLink from "next/link"

import { CardForLink } from "./CardForLink"
import FonctionnementPlateforme from "./fonctionnementPlateforme"

const RessourcesRecruteur = () => {
  return (
    <Box>
      La bonne alternance vous propose un ensemble d’outils et de liens pour faciliter vos démarches liées à l’alternance.
      <Flex as="h2" fontSize={32} fontWeight={700} mt={6} mb={4}>
        Testez vos connaissances
      </Flex>
      <Text mb={6}>Entraînez-vous avec notre premier parcours de mise en situation à destination des recruteurs :</Text>
      <Grid my={6} templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={6}>
        <CardForLink
          imageUrl="/images/serrage-main.svg"
          link="https://dinum.didask.com/courses/lalternance-pour-les-recruteurs/65b8129d2ff4dca088d2bfce"
          text="Vous vous apprêtez à accueillir un·e alternant·e ?"
          linkTitle="Découvrez les étapes clés pour réussir son intégration"
          linkAriaLabel="Etapes pour accueillir un alternant - nouvelle fenêtre"
        />
      </Grid>
      <Flex as="h2" fontSize={32} fontWeight={700} my={8}>
        <Image src="/images/pages_ressources/conseils et astuces.svg" alt="" mr={4} aria-hidden="true" />
        Liens utiles
      </Flex>
      <UnorderedList>
        <ListItem mb={4}>
          <Text as="span" fontWeight={700}>
            Estimez le coût d’un alternant
          </Text>{" "}
          pour votre entreprise avec le simulateur de l’URSSAF.{" "}
          <Link
            href="https://www.alternance.emploi.gouv.fr/simulateur-employeur/etape-1"
            aria-label="Accéder au simulateur de coût d'un alternant"
            isExternal
            variant="basicUnderlinedBlue"
          >
            En savoir plus <ExternalLinkIcon mb="3px" ml="2px" />
          </Link>
        </ListItem>
        <ListItem mb={4}>
          En janvier dernier, le Gouvernement a annoncé son nouveau plan d’aide aux entreprises, allant jusqu’à 6000 euros pour toutes les embauches d'alternants en 2023 et 2024.
          Ces aides sont valables jusqu'en 2027.{" "}
          <Link href="https://entreprendre.service-public.fr/vosdroits/F23556" aria-label="Accéder au site des aides du gouvernement" isExternal variant="basicUnderlinedBlue">
            En savoir plus <ExternalLinkIcon mb="3px" ml="2px" />
          </Link>
        </ListItem>
        <ListItem mb={4}>
          <Text as="span" fontWeight={700}>
            Retrouvez les informations légales de votre entreprise
          </Text>{" "}
          sur l’annuaire des entreprises, à partir de votre SIRET.{" "}
          <Link href="https://annuaire-entreprises.data.gouv.fr/" aria-label="Accéder à l'annuaire des entreprises" isExternal variant="basicUnderlinedBlue">
            En savoir plus <ExternalLinkIcon mb="3px" ml="2px" />
          </Link>
        </ListItem>
        <ListItem mb={4}>
          <Text as="span" fontWeight={700}>
            Chaque entreprise est rattachée à un Opérateur de compétences (OPCO).
          </Text>{" "}
          Il s’agit de votre interlocuteur de proximité pour vos démarches liées à l’alternance (financement des contrats, formation, ...). Votre OPCO peut vous aider à affiner vos
          besoins de recrutement. Aussi, sachez qu’en déposant une offre d’emploi en alternance sur le site de votre OPCO, celle-ci sera rediffusée sur les sites consultés par les
          jeunes.
          <br />
          Vous ne connaissez pas votre OPCO ? Retrouvez votre OPCO sur{" "}
          <Link href="https://quel-est-mon-opco.francecompetences.fr/" aria-label="Accéder au site de France compétences" isExternal variant="basicUnderlinedBlue">
            France compétences <ExternalLinkIcon mb="3px" ml="2px" />
          </Link>
        </ListItem>
        <ListItem mb={4}>
          <Text as="span" fontWeight={700}>
            Quelle est la différence entre un contrat en apprentissage et un contrat de professionnalisation ?
          </Text>{" "}
          Le portail de l’alternance vous explique les différences.{" "}
          <Link
            href="https://www.alternance.emploi.gouv.fr/je-suis-employeur#Pour%20quel%20employeur%20?"
            aria-label="Accéder au portail de l'alternance"
            isExternal
            variant="basicUnderlinedBlue"
          >
            En savoir plus <ExternalLinkIcon mb="3px" ml="2px" />
          </Link>
        </ListItem>
        <ListItem mb={4}>
          <Link
            href="https://travail-emploi.gouv.fr/IMG/pdf/precis-apprentissage.pdf"
            aria-label="Accéder au précis de l'apprentissage - nouvelle fenêtre"
            isExternal
            variant="basicUnderlinedBlue"
          >
            Le Précis de l’apprentissage <ExternalLinkIcon mb="3px" ml="2px" />
          </Link>{" "}
          vous présente des repères sur l’apprentissage. Il est issu des travaux de la DGEFP et d’une consultation des acteurs institutionnels de l’apprentissage. Il répond à
          l’objectif d’harmoniser les pratiques des acteurs de l’apprentissage et vise à donner des repères juridiques et des clefs de compréhension autour de bases documentaires
          et méthodologiques communes.
        </ListItem>
        <ListItem mb={4}>
          Le contrat en apprentissage{" "}
          <Link
            href="https://www.service-public.fr/particuliers/vosdroits/R1319"
            aria-label="Accéder au cerfa numéro 10103-11 - nouvelle fenêtre"
            isExternal
            variant="basicUnderlinedBlue"
          >
            Cerfa n° 10103*11
          </Link>{" "}
          doit être signé et transmis à votre OPCO <b>au plus tard 5 jours après le démarrage du contrat</b>. Gagnez du temps ! Optimisez la création de vos contrats
          d’apprentissage avec le service{" "}
          <Link
            href="https://contrat.apprentissage.beta.gouv.fr/"
            aria-label="Accéder au service de cerfa dématérialisé - nouvelle fenêtre"
            isExternal
            variant="basicUnderlinedBlue"
          >
            CERFA dématérialisé
          </Link>
        </ListItem>
        <ListItem mb={4}>En tant qu’employeur, vous devez conserver le contrat signé pendant 5 ans en cas de contrôle.</ListItem>
      </UnorderedList>
      <Flex mt={12} mb={12}>
        <Image src="/images/pages_ressources/recruteur.svg" alt="" mr={4} aria-hidden="true" />
        <Center>
          <Box>
            <Text as="div" fontWeight={700} mb={4}>
              Diffusez simplement et gratuitement vos offres en alternance
            </Text>
            <NextLink legacyBehavior passHref href="/acces-recruteur">
              <Link aria-label="Accès à la page d'accueil" variant="basicUnderlinedBlue">
                Accéder à la page d’accueil →
              </Link>
            </NextLink>
          </Box>
        </Center>
      </Flex>
      <FonctionnementPlateforme />
    </Box>
  )
}

export default RessourcesRecruteur
