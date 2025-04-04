import { Box, Center, Flex, Image, ListItem, Text, UnorderedList } from "@chakra-ui/react"

import { DsfrLink } from "../dsfr/DsfrLink"

import ConseilsEtAstuces from "./conseilsEtAstuces"
import FonctionnementPlateforme from "./fonctionnementPlateforme"
import MisesEnSituation from "./misesEnSituation"

const RessourcesCFA = () => {
  return (
    <Box>
      <Box>
        La bonne alternance vous propose un ensemble d’outils pour soutenir vos démarches d’accompagnement auprès des jeunes et de vos entreprises partenaires.
        <Flex as="h2" fontSize={32} fontWeight={700} mt={6} mb={4}>
          Liens utiles pour accompagner vos candidats
        </Flex>
        <Text>Proposez-leur de s’entraîner avec nos 3 parcours de mise en situation :</Text>
        <MisesEnSituation target="cfa" />
        Partagez-leurs des conseils et astuces pour les aider dans leurs démarches de recherche de formation et d’emploi en alternance :
        <ConseilsEtAstuces />
        <Flex as="h2" fontSize={32} fontWeight={700} mt={10} mb={8}>
          <Image src="/images/pages_ressources/conseils et astuces.svg" alt="" mr={4} aria-hidden="true" />
          Autres liens utiles
        </Flex>
        <Box ml={4}>
          <UnorderedList>
            <ListItem mb={4}>
              Pour rechercher une formation en alternance, le{" "}
              <DsfrLink href="https://catalogue-apprentissage.intercariforef.org/" aria-label="Accéder au catalogue des offres de formation en apprentissage">
                Catalogue des offres de formations en apprentissage
              </DsfrLink>{" "}
              du Réseau des Carif-Oref centralise nationalement l'ensemble des offres de formation en apprentissage collectées régionalement par les Carif-Oref.
            </ListItem>
            <ListItem mb={4}>
              <DsfrLink href="https://travail-emploi.gouv.fr/IMG/pdf/precis-apprentissage.pdf" aria-label="Accéder au précis de l'apprentissage">
                Le Précis de l’apprentissage
              </DsfrLink>{" "}
              vous présente des repères sur l’apprentissage. Il est issu des travaux de la DGEFP et d’une consultation des acteurs institutionnels de l’apprentissage. Il répond à
              l’objectif d’harmoniser les pratiques des acteurs de l’apprentissage et vise à donner des repères juridiques et des clefs de compréhension autour de bases
              documentaires et méthodologiques communes.
            </ListItem>
            <ListItem mb={4}>
              <DsfrLink href="https://www.cfadock.fr/doc/Vade-mecum%20CFA.pdf" aria-label="Accéder au vade-mecum CFA">
                Le “Vade-mecum CFA”
              </DsfrLink>{" "}
              précise les modalités pratiques de gestion des contrats d’apprentissage.Il concerne la gestion et le financement des contrats d’apprentissage conclus dans le secteur
              privé et a été élaboré en concertation avec les têtes de réseau des Centres de Formation pour Apprentis (CFA) et la Direction Générale Emploi et Formation
              Professionnelle (DGEFP).
            </ListItem>
            <ListItem mb={4}>
              {" "}
              <Text as="span" fontWeight={700}>
                Le tableau de bord de l’apprentissage
              </Text>{" "}
              permet de visualiser en temps réel la situation de l’apprentissage sur un territoire grâce à l’agrégation quotidienne de données des CFA. Les indicateurs actuellement
              exposés sont :
              <br />- Le volume d’apprentis ;<br />- Le nombre d’apprenants sans contrat ;<br />- Le nombre d’apprenants en situation de rupture de contrat ;
              <br />- Le nombre d’apprenants en situation d’abandon.
              <br />{" "}
              <DsfrLink href="https://cfas.apprentissage.beta.gouv.fr/" aria-label="Accéder au tableau de bord de l'apprentissage">
                En savoir plus
              </DsfrLink>
            </ListItem>
            Attirez des candidats en offrant plus de visibilité à vos formations et offres d’emplois Accéder à la page d’accueil
          </UnorderedList>
        </Box>
        <Flex mt={12} mb={12}>
          <Image src="/images/pages_ressources/offres completes.svg" alt="" mr={4} aria-hidden="true" />
          <Center>
            <Box>
              <Text as="div" fontWeight={700} mb={4}>
                Attirez des candidats en offrant plus de visibilité à vos formations et offres d’emplois
              </Text>

              <DsfrLink href="/organisme-de-formation" aria-label="Accès à la page d'accueil">
                Accéder à la page d’accueil →
              </DsfrLink>
            </Box>
          </Center>
        </Flex>
        <FonctionnementPlateforme />
      </Box>
    </Box>
  )
}

export default RessourcesCFA
