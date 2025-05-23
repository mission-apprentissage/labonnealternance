import { Box, Center, Flex, Grid, Image, ListItem, Text, UnorderedList } from "@chakra-ui/react"

import { DsfrLink } from "../dsfr/DsfrLink"

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
          <DsfrLink href="https://www.alternance.emploi.gouv.fr/simulateur-employeur/etape-1" aria-label="Accéder au simulateur de coût d'un alternant">
            En savoir plus
          </DsfrLink>
        </ListItem>
        <ListItem mb={4}>
          En janvier dernier, le Gouvernement a annoncé son nouveau plan d’aide aux entreprises pour 2025.{" "}
          <DsfrLink href="https://entreprendre.service-public.fr/vosdroits/F23556" aria-label="Accéder au site des aides du gouvernement">
            En savoir plus
          </DsfrLink>
        </ListItem>
        <ListItem mb={4}>
          <Text as="span" fontWeight={700}>
            Retrouvez les informations légales de votre entreprise
          </Text>{" "}
          sur l’annuaire des entreprises, à partir de votre SIRET.{" "}
          <DsfrLink href="https://annuaire-entreprises.data.gouv.fr/" aria-label="Accéder à l'annuaire des entreprises">
            En savoir plus
          </DsfrLink>
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
          <DsfrLink href="https://quel-est-mon-opco.francecompetences.fr/" aria-label="Accéder au site de France compétences">
            France compétences
          </DsfrLink>
        </ListItem>
        <ListItem mb={4}>
          <Text as="span" fontWeight={700}>
            Quelle est la différence entre un contrat en apprentissage et un contrat de professionnalisation ?
          </Text>{" "}
          Le portail de l’alternance vous explique les différences.{" "}
          <DsfrLink href="https://www.alternance.emploi.gouv.fr/je-suis-employeur#Pour%20quel%20employeur%20?" aria-label="Accéder au portail de l'alternance">
            En savoir plus
          </DsfrLink>
        </ListItem>
        <ListItem mb={4}>
          <DsfrLink href="https://travail-emploi.gouv.fr/IMG/pdf/precis-apprentissage.pdf" aria-label="Accéder au précis de l'apprentissage - nouvelle fenêtre">
            Le Précis de l’apprentissage
          </DsfrLink>{" "}
          vous présente des repères sur l’apprentissage. Il est issu des travaux de la DGEFP et d’une consultation des acteurs institutionnels de l’apprentissage. Il répond à
          l’objectif d’harmoniser les pratiques des acteurs de l’apprentissage et vise à donner des repères juridiques et des clefs de compréhension autour de bases documentaires
          et méthodologiques communes.
        </ListItem>
        <ListItem mb={4}>
          Le contrat en apprentissage{" "}
          <DsfrLink href="https://www.service-public.fr/particuliers/vosdroits/R1319" aria-label="Accéder au cerfa numéro 10103-11 - nouvelle fenêtre">
            Cerfa n° 10103*11
          </DsfrLink>{" "}
          doit être signé et transmis à votre OPCO <b>au plus tard 5 jours après le démarrage du contrat</b>. Gagnez du temps ! Optimisez la création de vos contrats
          d’apprentissage avec le service{" "}
          <DsfrLink href="https://contrat.apprentissage.beta.gouv.fr/" aria-label="Accéder au service de cerfa dématérialisé - nouvelle fenêtre">
            CERFA dématérialisé
          </DsfrLink>
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
            <DsfrLink href="/acces-recruteur" aria-label="Accès à la page d'accueil">
              Accéder à la page d’accueil →
            </DsfrLink>
          </Box>
        </Center>
      </Flex>
      <FonctionnementPlateforme />
    </Box>
  )
}

export default RessourcesRecruteur
