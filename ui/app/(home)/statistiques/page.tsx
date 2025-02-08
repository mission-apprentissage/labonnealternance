import { Box, Container, Divider, SimpleGrid, Tab, TabList, TabPanel, TabPanels, Tabs, Text } from "@chakra-ui/react"
import { Metadata } from "next"

import { publicConfig } from "../../../config.public"
import { PAGES } from "../../../utils/routes.utils"
import Breadcrumb from "../../components/Breadcrumb"

export const metadata: Metadata = {
  title: PAGES.static.statistiques.getMetadata.title,
  description: PAGES.static.statistiques.getMetadata.description,
}

// KBA : à tester en preview, sans ça le composant est server side.
// const metabaseIframeOnLoad = (ev) => {
//   try {
//     const ifr = ev.target
//     if (ifr.contentWindow) {
//       const doc = ifr.contentWindow.document
//       const footer = doc.getElementsByClassName("EmbedFrame-footer")
//       footer.length && footer[0].remove()
//       setTimeout(() => {
//         // hack pour supprimer le bloc titre qui n'est pas rendu immédiatement
//         const header = doc.getElementsByClassName("EmbedFrame-header")
//         header.length && header[0].remove()
//       }, 1500)
//     }
//   } catch (err) {
//     // evite un affichage d'erreur sur des environnements où le nom de domaine ne colle pas à celui du metabase
//   }
// }

const selectedTabParams = {
  color: "bluefrance.500",
  background: "white",
  borderBottom: "none",
  borderTop: "2px solid",
  borderColorTop: "bluefrance.500",
  borderLeft: "1px solid",
  borderRight: "1px solid",
  borderRightColor: "#ddd",
  borderLeftColor: "#ddd",
}

const tabParams = {
  color: "#161616",
  background: "#E3E3FD",
  marginRight: 2,
}

export default function Statistiques() {
  return (
    <Box>
      <Box as="main">
        <Container variant="responsiveContainer" display="flex">
          <Breadcrumb pages={[PAGES.static.statistiques]} />
        </Container>
        <Container px={{ base: 2, sm: 4, md: 12 }} py={8} my={0} mb={[0, 12]} variant="whitePageContainer">
          <Box as="h1" mb={12}>
            <Text as="span" display="block" mb={1} variant="editorialContentH1">
              Statistiques
            </Text>
          </Box>
          <Text maxWidth="780px">
            La bonne alternance est une startup d’Etat incubée par beta.gouv. Nous développons un service à destination des publics selon les principes du Manifeste de beta.gouv.
            Nous mesurons l’impact de nos actions et publions en toute transparence nos statistiques.
            <br />
            <br />
            Notre méthode de calcul d’impact se base sur 3 étapes :<br />
            1. Mesurer l’exposition de l’information,
            <br />
            2. Mesurer le nombre de mises en relation générées par nos services,
            <br />
            3. Mesurer que ces mises en relation se convertissent en recrutements effectifs.
            <br />
            <br />
            Pour visualiser correctement cette page, veuillez désactiver votre bloqueur de publicité
          </Text>

          <Box mt={6}>
            <Tabs variant="unstyled">
              <TabList px={{ base: 0, sm: 4 }}>
                <Tab {...tabParams} _focus={{}} _selected={selectedTabParams}>
                  Exposition
                </Tab>
                <Tab {...tabParams} _focus={{}} _selected={selectedTabParams}>
                  Mise en relation
                </Tab>
                <Tab {...tabParams} _focus={{}} _selected={selectedTabParams}>
                  Conversion
                </Tab>
              </TabList>

              <TabPanels mt={6}>
                <TabPanel height="auto" color="grey.800" padding="0 !important;">
                  <Box mb={8} px={{ base: 1, sm: 2, md: 4 }} py={4} border="2px solid #E5E5E5" borderRadius="5px">
                    <Text mb={8} fontWeight={700} fontSize="28px" color="bluefrance.500" as="h3">
                      Les visites
                    </Text>
                    <Divider variant="pageTitleDivider" mt={6} mb={2} />
                    <iframe
                      width="100%"
                      // @ts-expect-error: ?
                      border="none"
                      height="800px"
                      title="stats_plausible"
                      plausible-embed="true"
                      src="https://plausible.io/share/labonnealternance.apprentissage.beta.gouv.fr?auth=Ck7r5NwNNf9IveZVA5U0O&embed=true&theme=light&background=transparent"
                      loading="lazy"
                    ></iframe>
                  </Box>

                  <Box mb={8} px={{ base: 1, sm: 2, md: 4 }} py={4} border="2px solid #E5E5E5" borderRadius="5px">
                    <Text mb={8} fontWeight={700} fontSize="28px" color="bluefrance.500" as="h3">
                      Les offres d'emploi
                    </Text>
                    <Divider variant="pageTitleDivider" mt={6} mb={2} />
                    <iframe
                      width="100%"
                      // @ts-expect-error: ?
                      border="none"
                      height="450px"
                      // onLoad={metabaseIframeOnLoad}
                      title="stats_offres_lba"
                      src={`${publicConfig.baseUrl}/metabase/public/dashboard/74a0d3f7-97e7-41b3-86ac-38cadbc21a76`}
                      loading="lazy"
                    ></iframe>
                  </Box>

                  <Box mb={8} px={{ base: 1, sm: 2, md: 4 }} py={4} border="2px solid #E5E5E5" borderRadius="5px">
                    <Text mb={8} fontWeight={700} fontSize="28px" color="bluefrance.500" as="h3">
                      Les formations
                    </Text>
                    <Divider variant="pageTitleDivider" mt={6} mb={2} />
                    <iframe
                      width="100%"
                      // @ts-expect-error: ?
                      border="none"
                      height="500px"
                      // onLoad={metabaseIframeOnLoad}
                      title="stats_formations_lba"
                      src={`${publicConfig.baseUrl}/metabase/public/dashboard/ff285493-4d51-4429-b330-497a14c92974`}
                      loading="lazy"
                    ></iframe>
                  </Box>
                </TabPanel>

                <TabPanel height="auto" color="grey.800" padding="0 !important;">
                  <Box mb={8} px={{ base: 1, sm: 2, md: 4 }} py={4} border="2px solid #E5E5E5" borderRadius="5px">
                    <Text mb={8} fontWeight={700} fontSize="28px" color="bluefrance.500" as="h3">
                      Les candidatures
                    </Text>
                    <Divider variant="pageTitleDivider" mt={6} mb={2} />
                    <iframe
                      width="100%"
                      // @ts-expect-error: ?
                      border="none"
                      height="500px"
                      // onLoad={metabaseIframeOnLoad}
                      title="stats_candidatures_lba"
                      src={`${publicConfig.baseUrl}/metabase/public/dashboard/9b0132ca-2629-4fa7-9be8-9183f2f7d98d`}
                      loading="lazy"
                    ></iframe>
                  </Box>

                  <Box mb={8} px={{ base: 1, sm: 2, md: 4 }} py={4} border="2px solid #E5E5E5" borderRadius="5px">
                    <Text mb={8} fontWeight={700} fontSize="28px" color="bluefrance.500" as="h3">
                      Les demandes de rendez-vous
                    </Text>
                    <Divider variant="pageTitleDivider" mt={6} mb={2} />
                    <iframe
                      width="100%"
                      // @ts-expect-error: ?
                      border="none"
                      height="330px"
                      title="stats_count_prdv"
                      // onLoad={metabaseIframeOnLoad}
                      src={`${publicConfig.baseUrl}/metabase/public/dashboard/d9818d96-22b4-4fa8-bf90-3109c8f86f14`}
                      loading="lazy"
                    ></iframe>
                  </Box>

                  <Box mb={8} px={{ base: 1, sm: 2, md: 4 }} py={4} border="2px solid #E5E5E5" borderRadius="5px">
                    <Text mb={8} fontWeight={700} fontSize="28px" color="bluefrance.500" as="h3">
                      Les modules pédagogiques
                    </Text>
                    <Divider variant="pageTitleDivider" mt={6} mb={2} />
                    <iframe
                      width="100%"
                      // @ts-expect-error: ?
                      border="none"
                      height="280px"
                      title="stats_modules_pedagogiques"
                      // onLoad={metabaseIframeOnLoad}
                      src={`${publicConfig.baseUrl}/metabase/public/dashboard/abf6bcc2-0da5-4f1d-a063-6f7dec80c363`}
                      loading="lazy"
                    ></iframe>
                  </Box>

                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                    <Box mb={8} px={{ base: 1, sm: 2, md: 4 }} py={4} border="2px solid #E5E5E5" borderRadius="5px">
                      <Text mb={8} fontWeight={700} fontSize="28px" color="bluefrance.500" as="h3">
                        Les réponses des
                        <br />
                        recruteurs
                      </Text>
                      <Divider variant="pageTitleDivider" mt={6} mb={2} />
                      <iframe
                        width="100%"
                        max-width="300px"
                        // @ts-expect-error: ?
                        border="none"
                        height="550px"
                        title="stats_reponses_recruteurs"
                        // onLoad={metabaseIframeOnLoad}
                        src={`${publicConfig.baseUrl}/metabase/public/dashboard/17a7b8f6-160c-4510-b723-fdedf961913c`}
                        loading="lazy"
                      ></iframe>
                    </Box>

                    <Box mb={8} px={{ base: 1, sm: 2, md: 4 }} py={4} border="2px solid #E5E5E5" borderRadius="5px">
                      <Text mb={8} fontWeight={700} fontSize="28px" color="bluefrance.500" as="h3">
                        Les réponses des organismes de formation
                      </Text>
                      <Divider variant="pageTitleDivider" mt={6} mb={2} />
                      <iframe
                        width="100%"
                        max-width="300px"
                        // @ts-expect-error: ?
                        border="none"
                        height="550px"
                        title="stats_reponses_cfa"
                        // onLoad={metabaseIframeOnLoad}
                        src={`${publicConfig.baseUrl}/metabase/public/dashboard/74000a35-edfa-4b6f-b28a-64a3c54a0f22`}
                        loading="lazy"
                      ></iframe>
                    </Box>
                  </SimpleGrid>
                </TabPanel>
                <TabPanel height="auto" color="grey.800" padding="0 !important;">
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                    <Box mb={8} px={{ base: 1, sm: 2, md: 4 }} py={4} border="2px solid #E5E5E5" borderRadius="5px">
                      <Text mb={8} fontWeight={700} fontSize="28px" color="bluefrance.500" as="h3">
                        Les signatures de contrat
                      </Text>
                      <Divider variant="pageTitleDivider" mt={6} mb={2} />
                      <iframe
                        width="100%"
                        max-width="300px"
                        // @ts-expect-error: ?
                        border="none"
                        height="350px"
                        title="stats_signatures_contrat"
                        // onLoad={metabaseIframeOnLoad}
                        src={`${publicConfig.baseUrl}/metabase/public/dashboard/2984c1be-175b-41bd-9bf8-8a892dac5565`}
                        loading="lazy"
                      ></iframe>
                    </Box>

                    <Box mb={8} px={{ base: 1, sm: 2, md: 4 }} py={4} border="2px solid #E5E5E5" borderRadius="5px">
                      <Text mb={8} fontWeight={700} fontSize="28px" color="bluefrance.500" as="h3">
                        Les inscriptions en formation
                      </Text>
                      <Divider variant="pageTitleDivider" mt={6} mb={2} />
                      <iframe
                        width="100%"
                        max-width="300px"
                        // @ts-expect-error: ?
                        border="none"
                        height="350px"
                        title="stats_inscriptions_formations"
                        // onLoad={metabaseIframeOnLoad}
                        src={`${publicConfig.baseUrl}/metabase/public/dashboard/46675941-a800-4f05-98f2-667d9810a912`}
                        loading="lazy"
                      ></iframe>
                    </Box>
                  </SimpleGrid>
                </TabPanel>
              </TabPanels>
            </Tabs>
          </Box>
        </Container>
      </Box>
    </Box>
  )
}
