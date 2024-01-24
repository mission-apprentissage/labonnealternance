import { Box, Flex, Grid, GridItem, Image } from "@chakra-ui/react"

import ConseilsEtAstuces from "./conseilsEtAstuces"

const RessourcesCFA = () => {
  return (
    <Box>
      <Box>
        La bonne alternance vous propose un ensemble d’outils pour soutenir vos démarches d’accompagnement auprès des jeunes et de vos entreprises partenaires.
        <Flex as="h2" fontSize={32} fontWeight={700} mt={6}>
          Liens utiles pour accompagner vos candidats
        </Flex>
        Proposez-leur de s’entraîner avec nos 3 parcours de mise en situation :
        <Grid>
          <GridItem>Vous recherchez votre employeur ? Apprenez à bien cibler les entreprises</GridItem>
          <GridItem>Vous avez bientôt un entretien d’embauche ? Entraînez-vous pour avoir plus de chances d'être retenu</GridItem>
          <GridItem>Vous allez bientôt démarrer votre contrat ? Familiarisez-vous avec la posture à adopter en entreprise</GridItem>
        </Grid>
        Partagez-leurs des conseils et astuces pour les aider dans leurs démarches de recherche de formation et d’emploi en alternance :
        <ConseilsEtAstuces />
        <Flex as="h2" fontSize={32} fontWeight={700} mt={8}>
          <Image src="/images/pages_ressources/conseils et astuces.svg" alt="" mr={4} aria-hidden="true" />
          Autres liens utiles
        </Flex>
        <Box>
          Pour rechercher une formation en alternance, le Catalogue des offres de formations en apprentissage du Réseau des Carif-Oref centralise nationalement l'ensemble des
          offres de formation en apprentissage collectées régionalement par les Carif-Oref. Le Précis de l’apprentissage vous présente des repères sur l’apprentissage. Il est issu
          des travaux de la DGEFP et d’une consultation des acteurs institutionnels de l’apprentissage. Il répond à l’objectif d’harmoniser les pratiques des acteurs de
          l’apprentissage et vise à donner des repères juridiques et des clefs de compréhension autour de bases documentaires et méthodologiques communes. Le “Vade-mecum CFA”
          précise les modalités pratiques de gestion des contrats d’apprentissage.Il concerne la gestion et le financement des contrats d’apprentissage conclus dans le secteur
          privé et a été élaboré en concertation avec les têtes de réseau des Centres de Formation pour Apprentis (CFA) et la Direction Générale Emploi et Formation Professionnelle
          (DGEFP). Le tableau de bord de l’apprentissage permet de visualiser en temps réel la situation de l’apprentissage sur un territoire grâce à l’agrégation quotidienne de
          données des CFA. Les indicateurs actuellement exposés sont :- Le volume d’apprentis ;- Le nombre d’apprenants sans contrat ;- Le nombre d’apprenants en situation de
          rupture de contrat ;- Le nombre d’apprenants en situation d’abandon.En savoir plus Attirez des candidats en offrant plus de visibilité à vos formations et offres
          d’emplois Accéder à la page d’accueil Vous avez une question sur le fonctionnement de notre plateforme ? Consulter la FAQ
        </Box>
      </Box>
    </Box>
  )
}

export default RessourcesCFA
