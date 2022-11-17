import React, { useEffect, useState } from "react";
import Navigation from "../components/navigation";
import Breadcrumb from "../components/breadcrumb";
import ScrollToTop from "../components/ScrollToTop";
import { NextSeo } from "next-seo";
import baseUrl from "../utils/baseUrl";
import axios from "axios";
import { NotionRenderer } from "react-notion-x";
import Footer from "../components/footer";
import { Box, Container, Divider, Grid, GridItem, Text, Spinner } from '@chakra-ui/react';
import { Tabs, TabList, TabPanels, Tab, TabPanel } from '@chakra-ui/react'

const FAQ = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [recordMapNotionRecruteur, setRecordMapNotionRecruteur] = useState(null);
  const [recordMapNotionOrganisme, setRecordMapNotionOrganisme] = useState(null);
  const [recordMapNotionCandidat, setRecordMapNotionCandidat] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);

      const [notionFAQrecruteur, notionFAQorganisme, notionFAQcandidat] = await Promise.all([
        await axios.get(baseUrl + "/api/faq/recruteur"),
        await axios.get(baseUrl + "/api/faq/organisme"),
        await axios.get(baseUrl + "/api/faq/candidat"),
      ]);

      setRecordMapNotionRecruteur(notionFAQrecruteur.data);
      setRecordMapNotionOrganisme(notionFAQorganisme.data);
      setRecordMapNotionCandidat(notionFAQcandidat.data);

      setIsLoading(false);
    };
    fetchData();
  }, []);

  return (
    <Box>
      <NextSeo
        title="F.A.Q | La bonne alternance | Trouvez votre alternance"
        description="Questions fréquemment posées. Résultats entreprises, résultats formations, etc."
      />

      <ScrollToTop />
      <Navigation bgcolor="is-white" />

      <Breadcrumb forPage="faq" label="FAQ" />

      <Container p={12} my={0} mb={[0, 12]} variant="pageContainer">
        <Grid templateColumns="repeat(12, 1fr)">
          <GridItem px={4} colSpan={[12, 12, 12, 5]}>
            <Box as="h1" >
              <Text as="span" display="block" mb={1} variant="editorialContentH1" color="#2a2a2a">Questions</Text>
              <Text as="span" display="block" mb={1} variant="editorialContentH1">fréquemment</Text>
              <Text as="span" display="block" mb={1} variant="editorialContentH1">posées</Text>
            </Box>
            <Divider variant="pageTitleDivider" my={12} />
          </GridItem>
          <GridItem px={4} colSpan={[12, 12, 12, 7]}>
            {isLoading ? (
              <>
                <Box>
                  <Spinner />
                  <Box as="span" ml="2">Chargement en cours...</Box>
                </Box>
              </>
            ) : (
              <>
                <Box>
                    <Tabs>
                      <TabList>
                        <Tab>Candidat</Tab>
                        <Tab>Recruteur</Tab>
                        <Tab>Organisme de formation</Tab>
                      </TabList>

                      <TabPanels>
                        <TabPanel color="#1e1e1e" padding="0 !important;">
                          <NotionRenderer
                            recordMap={recordMapNotionCandidat}
                            fullPage={false}
                            darkMode={false}
                            disableHeader={true}
                            rootDomain={process.env.REACT_APP_BASE_URL}
                            bodyClassName="notion-body"
                          />
                        </TabPanel>
                        <TabPanel color="#1e1e1e" padding="0 !important;">
                          <NotionRenderer
                            recordMap={recordMapNotionRecruteur}
                            fullPage={false}
                            darkMode={false}
                            disableHeader={true}
                            rootDomain={process.env.REACT_APP_BASE_URL}
                            bodyClassName="notion-body"
                          />
                        </TabPanel>
                        <TabPanel color="#1e1e1e" padding="0 !important;">
                          <NotionRenderer
                            recordMap={recordMapNotionOrganisme}
                            fullPage={false}
                            darkMode={false}
                            disableHeader={true}
                            rootDomain={process.env.REACT_APP_BASE_URL}
                            bodyClassName="notion-body"
                          />
                        </TabPanel>
                      </TabPanels>
                    </Tabs>
                </Box>
              </>
            )}
          </GridItem>
        </Grid>
      </Container>
      <Box mb={3}>&nbsp;</Box>
      <Footer />
    </Box>
  );
};

export default FAQ;
