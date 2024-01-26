import { Box, Flex, Image } from "@chakra-ui/react"

import ConseilsEtAstuces from "./conseilsEtAstuces"
import FonctionnementPlateforme from "./fonctionnementPlateforme"
import MisesEnSituation from "./misesEnSituation"

const RessourcesCandidat = () => {
  return (
    <Box>
      La bonne alternance vous propose un ensemble d’outils et de liens pour vous aider dans vos démarches de recherche de formation et d’emploi en alternance.
      <Flex as="h2" fontSize={32} fontWeight={700} mt={6} mb={4}>
        Testez vos connaissances
      </Flex>
      <MisesEnSituation target="candidat" />
      <Flex as="h2" fontSize={32} fontWeight={700} mt={8}>
        <Image src="/images/pages_ressources/conseils et astuces.svg" mr={4} alt="" aria-hidden="true" />
        Conseils et astuces
      </Flex>
      <ConseilsEtAstuces />
      <Box>
        Suivre ses candidatures est essentiel pour penser à relancer à temps les recruteurs et savoir quelles entreprises ont déjà été contactées. Pour vous aider dans le suivi de
        vos candidatures, La bonne alternance vous propose un exemple de tableau : Tableau de suivi - Excel Tableau de suivi - Numbers Tableau de suivi - LibreOffice Vous avez une
        question sur le fonctionnement de notre plateforme ? Consulter la FAQ
      </Box>
      <FonctionnementPlateforme />
    </Box>
  )
}

export default RessourcesCandidat
