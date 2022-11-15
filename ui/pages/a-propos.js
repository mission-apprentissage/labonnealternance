import React from "react";
import Navigation from "../components/navigation";
import ScrollToTop from "../components/ScrollToTop";
import Breadcrumb from "../components/breadcrumb";
import logoPrdv from "../public/images/logo_prdv.svg";
import logoMatcha from "../public/images/logo_matcha.svg";
import logoCatalogue from "../public/images/logo_catalogue.svg";
import { NextSeo } from "next-seo";

import logoLbb from "../public/images/logo-lbb.svg";
import logoLbf from "../public/images/logo-labonneformation.svg";
import logoMaintenant from "../public/images/logo-maintenant.svg";
import logoAvril from "../public/images/logo-avril.svg";
import logoClara from "../public/images/logo-clara.svg";

import Footer from "../components/footer";
import ExternalLink from "../components/externalLink";

import { Box, Container, Divider, Flex, Grid, GridItem, Image, SimpleGrid, Text, Link } from '@chakra-ui/react';

const ServiceCard = ({logo, title, text, url, mt, mb, imageMT, imageML}) => {
  return (
  <Box mt={mt} mb={mb}>
    <Flex bg="white" py="18px" px="24px" direction={["column","row"]} borderRadius="10px" alignItems="center" boxShadow="0 0 12px rgb(0 0 0 / 21%)">
      <Box minW="68px" minH="68px" bg="grey.300" borderRadius="70px" >
        <Image src={logo} alt="" mt={imageMT} ml={imageML} />
      </Box>
      <Box pl={2} textAlign={["center","left"]}>
        <Text color="grey.700" fontSize="22px" lineHeight="27px" fontWeight="700">{title}</Text>
        <Text color="grey.600">{text}</Text>
        <Link textDecoration="underline" color="grey.600" href={url} isExternal>En savoir plus</Link>
      </Box>
    </Flex>
  </Box> )
}

const StartupCard = ({logoUrl,url, title }) => {
  return (
          <Box mx={4} mt={4} mb={6} py={4} px={3} bg="white" boxShadow="0px 0px 12px rgb(0 0 0 / 21%)" borderRadius="10px" >
            <Box height="80px" display="flex" alignItems="center" justifyContent="center">
              <Image src={logoUrl} width="134px" alt="" />
            </Box>
            <Box pl={2}>
              <Link url={url} isExternal>
                {title}
              </Link>
            </Box>
          </Box>  
  )
}
const APROPOS = () => (
  <div>
    <NextSeo
      title="A propos | La bonne alternance | Trouvez votre alternance"
      description="Vous ne trouvez pas de contrat ou d'offres d'alternance ? Essayez La bonne alternance ! Trouvez ici les formations en alternance et les entreprises qui recrutent régulièrement en alternance."
    />

    <ScrollToTop />
    <Navigation />

    <Breadcrumb forPage="a-propos" label="A propos" />

    <Container p={12} my={0} mb={[0,12]} variant="pageContainer">
      <Grid templateColumns="repeat(12, 1fr)">
        <GridItem px={4} colSpan={[12,12,12,5]}>
            <Text variant="editorialContentH1" as="h1">
              <Text as="span" color="black">A propos de</Text>
              <br />
              La bonne alternance
            </Text>            
            <Divider variant="pageTitleDivider" my={12}  />
        </GridItem>
        <GridItem px={4} colSpan={[12,12,12,7]}>
          <Text variant="editorialContentH2" as="h2">Le saviez-vous ?</Text>
          <Text as="p" mb={4}>
            7 employeurs sur 10 recrutent sans déposer d’offre d’emploi.
            <br />
            Il est essentiel dans votre recherche de proposer votre candidature à des entreprises n’ayant pas forcément
            déposé d’offre d’emploi en alternance.
          </Text>
          <Text as="p" mb={4}>
            Notre algorithme La bonne alternance analyse les offres et les recrutements des 6 dernières années pour vous
            proposer les entreprises qui recrutent régulièrement en alternance (contrat d&apos;apprentissage ou contrat de
            professionnalisation).
          </Text>

          <Text as="p" mb={4}>En complément, le service La bonne alternance expose les formations disponibles en apprentissage.</Text>

          <Text as="p" mb={4}>
            Pour une meilleure lisibilité, les résultats sont affichés sur une carte et en liste.
            <br />
            En cliquant sur une entreprise, vous accédez à sa description, ses coordonnées lorsqu’elles sont
            disponibles, ainsi qu’à des conseils pour postuler.
          </Text>

          <Text variant="editorialContentH2" as="h2">Qui sommes-nous ?</Text>

          <Text as="p" mb={4}>
            La bonne alternance est d’abord une start-up interne de Pôle emploi créée et développée par des conseillers.{" "}
            <br />
            Reprise par la{" "}
            <Link variant="editorialContentLink" href="https://mission-apprentissage.gitbook.io/general/" isExternal>Mission apprentissage</Link>
            {" "}en 2020, le site ajoute désormais des informations sur les formations en apprentissage et les offres d&apos;emploi
            en alternance.
          </Text>

          <Text variant="editorialContentH2" as="h2">Les services de La bonne alternance</Text>

          <ServiceCard mt={6} 
            logo={logoMatcha} 
            title="Dépôt d&apos;offres simplifié" 
            text="Susciter des recrutements en alternance" 
            url="https://mission-apprentissage.gitbook.io/general/les-services-en-devenir/untitled" 
            imageMT="-2px"
            imageML="0"
          />

          <ServiceCard mt={4} 
            logo={logoCatalogue} 
            title="Catalogue des formations" 
            text="Un catalogue élargi de formations en apprentissage" 
            url="https://mission-apprentissage.gitbook.io/catalogue/" 
            imageMT="20px"
            imageML="20px"
          />

          <ServiceCard mt={4} mb={6} 
            logo={logoPrdv} 
            title="Rendez-vous apprentissage" 
            text="Pour échanger facilement avec les centres de formation" 
            url="https://mission-apprentissage.gitbook.io/general/les-services-en-devenir/prise-de-rendez-vous"
            imageMT="4px"
            imageML="4px"
          />
          
          <Text variant="editorialContentH2" as="h2">Autres services de Pôle Emploi</Text>

          <SimpleGrid columns={[1,1,2]}>
            <StartupCard logoUrl={logoLbb} url="https://labonneboite.pole-emploi.fr/" title="Trouver des entreprises qui recrutent sans déposer d'offres d'emploi" />
            <StartupCard logoUrl={logoMaintenant} url="https://maintenant.pole-emploi.fr/" title="Vous valez plus qu'un CV ! Trouvez le bon job en moins de 5 minutes" />
          </SimpleGrid>
          
          <SimpleGrid columns={[1,1,2]}>
            <StartupCard logoUrl="/images/logo-memo.png" url="https://memo.pole-emploi.fr/" title="Organiser votre recherche d'emploi avec notre tableau de bord" />
            <StartupCard logoUrl={logoAvril} url="https://avril.pole-emploi.fr/" title="Trouvez une formation en fonction de votre profil ET du marché du travail" />
          </SimpleGrid>

          <Text variant="editorialContentH2" as="h2">Autres liens utiles</Text>
          <div className="c-about-others">
            <div className="c-about-other">
              <div className="c-about-otherleft">
                <span className="c-about-otherbullet">•</span>
                <span className="c-about-otherlink">
                  <ExternalLink url="https://diagoriente.beta.gouv.fr/" title="Diagoriente" />
                </span>
              </div>
              <div className="c-about-otherright">
                <span className="c-about-otherdescr">
                  Outil d&apos;orientation complet qui permet d&apos;accéder à des pistes métiers en adéquation avec ses intérêts.
                </span>
              </div>
            </div>
            <div className="c-about-other">
              <div className="c-about-otherleft">
                <span className="c-about-otherbullet">•</span>
                <span className="c-about-otherlink">
                  <ExternalLink
                    url="https://www.parcoursup.fr/index.php?desc=formations_apprentissage"
                    title="Parcoursup"
                  />
                </span>
              </div>
              <div className="c-about-otherright">
                <span className="c-about-otherdescr">Les conseils de parcoursup pour entrer en apprentissage.</span>
              </div>
            </div>
            <div className="c-about-other">
              <div className="c-about-otherleft">
                <span className="c-about-otherbullet">•</span>
                <span className="c-about-otherlink">
                  <ExternalLink url="https://www.parcoursup.fr/index.php?desc=services_numeriques" title="Parcoursup" />
                </span>
              </div>
              <div className="c-about-otherright">
                <span className="c-about-otherdescr">
                  Les services d’aide à l’orientation vers les études supérieures proposés par Parcoursup.
                </span>
              </div>
            </div>
            <div className="c-about-other">
              <div className="c-about-otherleft">
                <span className="c-about-otherbullet">•</span>
                <span className="c-about-otherlink">
                  <ExternalLink url="https://www.myjobglasses.com/" title="Myjobglasses" />
                </span>
              </div>
              <div className="c-about-otherright">
                <span className="c-about-otherdescr">
                  Myjobglasses vous aide à identifier le métier qui vous correspond.
                </span>
              </div>
            </div>
            <div className="c-about-other">
              <div className="c-about-otherleft">
                <span className="c-about-otherbullet">•</span>
                <span className="c-about-otherlink">
                  <ExternalLink 
                    url="https://media.giphy.com/media/3oz8xzYXuCWF1IXv68/giphy.gif" 
                    title="The one" />
                </span>
              </div>
              <div className="c-about-otherright">
                <span className="c-about-otherdescr">
                  The one vous aide dans toutes vos démarches de recherche d&apos;une alternance.
                </span>
              </div>
            </div>
            <div className="c-about-other">
              <div className="c-about-otherleft">
                <span className="c-about-otherbullet">•</span>
                <span className="c-about-otherlink">
                  <ExternalLink
                    url="https://openclassrooms.com/fr/courses/6003601-decouvrez-lalternance"
                    title="Openclassrooms"
                  />
                </span>
              </div>
              <div className="c-about-otherright">
                <span className="c-about-otherdescr">
                  Profitez d’un cours en ligne gratuit pour découvrir l&apos;alternance.
                </span>
              </div>
            </div>
            <div className="c-about-other">
              <div className="c-about-otherleft">
                <span className="c-about-otherbullet">•</span>
                <span className="c-about-otherlink">
                  <ExternalLink url="https://www.1jeune1solution.gouv.fr/" title="#1jeune1solution" />
                </span>
              </div>
              <div className="c-about-otherright">
                <span className="c-about-otherdescr">
                  Je suis jeune, je découvre toutes les solutions pour préparer mon avenir.
                </span>
              </div>
            </div>
          </div>
        </GridItem>
      </Grid>
    </Container>
    <Box mb={3}>&nbsp;</Box>
    <Footer />
  </div>
);

export default APROPOS;
