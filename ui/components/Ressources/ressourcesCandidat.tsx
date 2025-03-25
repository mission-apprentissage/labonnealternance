import { Box, Center, Flex, Image, List, ListItem, Text } from "@chakra-ui/react"

import { DsfrLink } from "../dsfr/DsfrLink"

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
      <Text>Entraînez-vous avec nos 4 parcours de mise en situation :</Text>
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
              <List>
                <ListItem mb={2}>
                  <DsfrLink href="/ressources/Tableau-de-suivi-des-candidatures-a-imprimer_La-bonne-alternance_PDF.pdf" data-tracking-id="telecharger-fichier-suivi-candid">
                    <Flex>
                      <Image src="/images/icons/download_ico.svg" mr={1} alt="" aria-hidden="true" />
                      Tableau de suivi à imprimer - PDF
                    </Flex>
                  </DsfrLink>
                </ListItem>
                <ListItem mb={2}>
                  <DsfrLink href="/ressources/Tableau-de-suivi-des-candidatures_La-bonne-alternance_Excel.xlsx" data-tracking-id="telecharger-fichier-suivi-candid">
                    <Flex>
                      <Image src="/images/icons/download_ico.svg" mr={1} alt="" aria-hidden="true" />
                      Tableau de suivi - Excel
                    </Flex>
                  </DsfrLink>
                </ListItem>
                <ListItem mb={2}>
                  <DsfrLink href="/ressources/Tableau-de-suivi-des-candidatures_La-bonne-alternance_Numbers.numbers" data-tracking-id="telecharger-fichier-suivi-candid">
                    <Flex>
                      <Image src="/images/icons/download_ico.svg" mr={1} alt="" aria-hidden="true" />
                      Tableau de suivi - Numbers
                    </Flex>
                  </DsfrLink>
                </ListItem>
                <ListItem>
                  <DsfrLink href="/ressources/Tableau-de-suivi-des-candidatures_La-bonne-alternance_LibreOffice.ods" data-tracking-id="telecharger-fichier-suivi-candid">
                    <Flex>
                      <Image src="/images/icons/download_ico.svg" mr={1} alt="" aria-hidden="true" />
                      Tableau de suivi - LibreOffice
                    </Flex>
                  </DsfrLink>
                </ListItem>
              </List>
            </Box>
          </Center>
        </Flex>
      </Box>
      <FonctionnementPlateforme />
    </Box>
  )
}

export default RessourcesCandidat
