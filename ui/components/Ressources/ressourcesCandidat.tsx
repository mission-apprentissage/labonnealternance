import { Box, Grid, GridItem } from "@chakra-ui/react"

import ConseilsEtAstuces from "./conseilsEtAstuces"

const RessourcesCandidat = () => {
  return (
    <Box>
      La bonne alternance vous propose un ensemble d’outils et de liens pour vous aider dans vos démarches de recherche de formation et d’emploi en alternance.
      <Box as="h2">Testez vos connaissances</Box>
      Entraînez-vous avec nos 4 parcours de mise en situation :
      <Grid>
        <GridItem>Vous recherchez votre formation ? Préparez-vous à échanger avec une école</GridItem>
        <GridItem>Vous recherchez votre employeur ? Apprenez à bien cibler les entreprises</GridItem>
        <GridItem>Vous avez bientôt un entretien d’embauche ? Entraînez-vous pour avoir plus de chances d'être retenu</GridItem>
        <GridItem>Vous allez bientôt démarrer votre contrat ? Familiarisez-vous avec la posture à adopter en entreprise</GridItem>
      </Grid>
      <h2>Conseils et astuces</h2>
      <ConseilsEtAstuces />
      <Box>
        Suivre ses candidatures est essentiel pour penser à relancer à temps les recruteurs et savoir quelles entreprises ont déjà été contactées. Pour vous aider dans le suivi de
        vos candidatures, La bonne alternance vous propose un exemple de tableau : Tableau de suivi - Excel Tableau de suivi - Numbers Tableau de suivi - LibreOffice Vous avez une
        question sur le fonctionnement de notre plateforme ? Consulter la FAQ
      </Box>
    </Box>
  )
}

export default RessourcesCandidat
