import React, { useEffect, useState } from "react";
import Navigation from "../components/navigation";
import Breadcrumb from "../components/breadcrumb";
import ScrollToTop from "../components/ScrollToTop";
import { NextSeo } from "next-seo";
import baseUrl from "../utils/baseUrl";
import axios from "axios";
import { NotionRenderer } from "react-notion-x";
import Footer from "../components/footer";
import { Spinner, Nav, NavItem, NavLink, TabContent, TabPane } from "reactstrap";
import { Box, Image, SimpleGrid, Text, Show } from '@chakra-ui/react'

const FAQ = (props) => {
  const [isLoading, setIsLoading] = useState(true);
  const [recordMapNotionRecruteur, setRecordMapNotionRecruteur] = useState(null);
  const [recordMapNotionOrganisme, setRecordMapNotionOrganisme] = useState(null);
  const [recordMapNotionCandidat, setRecordMapNotionCandidat] = useState(null);
  const [activeTab, setActiveTab] = useState("1");

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

      <div className="c-page-container container my-0 mb-sm-5 p-5">
        <div className="row">
          <div className="col-12 col-md-5">
            <h1>
              <span className="d-block c-page-title is-color-1">Questions</span>
              <span className="d-block c-page-title is-color-2">fréquemment</span>
              <span className="d-block c-page-title is-color-2">posées</span>
            </h1>
            <hr className="c-page-title-separator" align="left" />
          </div>
          <div className="col-12 col-md-7">
            {isLoading ? (
              <>
                <div>
                  <Spinner />
                  <span className="ml-2">Chargement en cours...</span>
                </div>
              </>
            ) : (
              <>
                <div>
                  <Nav tabs>
                    <NavItem>
                      <NavLink className={activeTab == "1" ? "active" : ""} onClick={() => setActiveTab("1")}>
                        Candidat
                      </NavLink>
                    </NavItem>
                    <NavItem>
                      <NavLink className={activeTab == "2" ? "active" : ""} onClick={() => setActiveTab("2")}>
                        Recruteur
                      </NavLink>
                    </NavItem>
                    <NavItem>
                      <NavLink className={activeTab == "3" ? "active" : ""} onClick={() => setActiveTab("3")}>
                        Organisme de formation
                      </NavLink>
                    </NavItem>
                  </Nav>
                  <TabContent activeTab={activeTab}>
                    <TabPane tabId="1">
                      <NotionRenderer
                        recordMap={recordMapNotionCandidat}
                        fullPage={false}
                        darkMode={false}
                        disableHeader={true}
                        rootDomain={process.env.REACT_APP_BASE_URL}
                        bodyClassName="notion-body"
                      />
                    </TabPane>
                    <TabPane tabId="2">
                      <NotionRenderer
                        recordMap={recordMapNotionRecruteur}
                        fullPage={false}
                        darkMode={false}
                        disableHeader={true}
                        rootDomain={process.env.REACT_APP_BASE_URL}
                        bodyClassName="notion-body"
                      />
                    </TabPane>
                    <TabPane tabId="3">
                      <NotionRenderer
                        recordMap={recordMapNotionOrganisme}
                        fullPage={false}
                        darkMode={false}
                        disableHeader={true}
                        rootDomain={process.env.REACT_APP_BASE_URL}
                        bodyClassName="notion-body"
                      />
                    </TabPane>
                  </TabContent>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      <div className="mb-3">&nbsp;</div>
      <Footer />
    </Box>
  );
};

export default FAQ;
