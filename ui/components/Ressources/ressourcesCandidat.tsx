import { Box, Center, Flex, Image, Link, Text } from "@chakra-ui/react"

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
      <Box mt={10} mb={6}>
        <Flex
          p={6}
          style={{
            boxShadow: "0px 0px 12px 6px #79797966",
          }}
        >
          <Image src="/images/pages_ressources/tableau de suivi.svg" alt="" mr={6} aria-hidden="true" />
          <Center>
            <Box>
              <Text fontSize={20} mb={2} fontWeight={700} as="div">
                Suivre ses candidatures est essentiel pour penser à relancer à temps les recruteurs et savoir quelles entreprises ont déjà été contactées.
              </Text>
              <Text as="div" mb={2}>
                Pour vous aider dans le suivi de vos candidatures, La bonne alternance vous propose un exemple de tableau :
              </Text>
              <Link
                href="https://www.notion.so/mission-apprentissage/Candidat-926be3cd35b241e48b684c6210e4b9c1?pvs=4#9ab541f2375f45aa87f3e5cefff46143"
                isExternal
                data-tracking-id="telecharger-fichier-suivi-candid"
                variant="basicUnderlinedBlue"
              >
                <Flex>
                  <Image src="/images/icons/download_ico.svg" mr={1} alt="" aria-hidden="true" />
                  Tableau de suivi - Excel
                </Flex>
              </Link>
              <br />
              <Link
                href="https://www.notion.so/mission-apprentissage/Candidat-926be3cd35b241e48b684c6210e4b9c1?pvs=4#7db9b82f19114042898e94e1b1bf0d39"
                isExternal
                data-tracking-id="telecharger-fichier-suivi-candid"
                variant="basicUnderlinedBlue"
              >
                <Flex>
                  <Image src="/images/icons/download_ico.svg" mr={1} alt="" aria-hidden="true" />
                  Tableau de suivi - Numbers
                </Flex>
              </Link>
              <br />
              <Link
                href="https://www.notion.so/mission-apprentissage/Candidat-926be3cd35b241e48b684c6210e4b9c1?pvs=4#7132e64eee174be3923bdadeec9927c9"
                isExternal
                data-tracking-id="telecharger-fichier-suivi-candid"
                variant="basicUnderlinedBlue"
              >
                <Flex>
                  <Image src="/images/icons/download_ico.svg" mr={1} alt="" aria-hidden="true" />
                  Tableau de suivi - LibreOffice
                </Flex>
              </Link>
            </Box>
          </Center>
        </Flex>
      </Box>
      <FonctionnementPlateforme />
    </Box>
  )
}

export default RessourcesCandidat
