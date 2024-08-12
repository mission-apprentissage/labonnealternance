import { ExternalLinkIcon } from "@chakra-ui/icons"
import { Box, Container, Divider, Grid, GridItem, Image, Link, ListItem, SimpleGrid, Text, UnorderedList } from "@chakra-ui/react"
import NextLink from "next/link"
import { NextSeo } from "next-seo"
import React from "react"

import Breadcrumb from "../components/breadcrumb"
import Footer from "../components/footer"
import Navigation from "../components/navigation"
import ScrollToTop from "../components/ScrollToTop"

const APropos = () => (
  <div>
    <NextSeo
      title="A propos | La bonne alternance | Trouvez votre alternance"
      description="Vous ne trouvez pas de contrat ou d'offres d'alternance ? Essayez La bonne alternance ! Trouvez ici les formations en alternance et les entreprises qui recrutent régulièrement en alternance."
    />

    <ScrollToTop />
    <Navigation />
    <Box as="main">
      <Breadcrumb forPage="a-propos" label="A propos" />

      <Container p={12} my={0} mb={[0, 12]} variant="pageContainer">
        <Grid templateColumns="repeat(12, 1fr)">
          <GridItem px={4} colSpan={[12, 12, 12, 5]}>
            <Text variant="editorialContentH1" as="h1">
              A propos
            </Text>
            <Divider variant="pageTitleDivider" my={4} />
          </GridItem>
          <GridItem px={4} colSpan={[12, 12, 12, 7]}>
            <Text variant="editorialContentH2" as="h2">
              Constat
            </Text>
            <Text as="p" mb={4}>
              L’alternance est une formule pleine de promesses pour les entreprises et les étudiants, car elle assure une formation proche des métiers et de la réalité du marché du
              travail. Pourtant le triptyque formation-entreprise-candidat est souvent complexe à mettre en oeuvre pour que l’alternance soit un succès.
            </Text>

            <Text variant="editorialContentH2" as="h2">
              La solution
            </Text>

            <Text as="p" mb={4}>
              La bonne alternance a pour objectif de simplifier les mises en relation entre ces trois types d’acteurs afin de faciliter les entrées en alternance.
            </Text>

            <Text as="p" mb={4}>
              <Text as="span" fontWeight={700}>
                Pour les recruteurs
              </Text>
              , nous proposons un dépôt d’offre simplifié, permettant d’exprimer un besoin de recrutement en alternance en moins d'une minute. Recruter en alternance est souvent un
              sujet compliqué pour les PME et TPE. Le manque de ressources et de connaissances en font un tâche peu prioritaire. D’ailleurs, 7 employeurs sur 10 recrutent sans
              déposer d’offre d’emploi.
            </Text>

            <Text as="p" mb={4}>
              <Text as="span" fontWeight={700}>
                Nous aidons les candidats
              </Text>{" "}
              intéressés par l'alternance à trouver une formation d’une part, et un contrat avec une entreprise d’autre part, en exposant et permettant aux candidat d'entrer en
              contact avec :
              <UnorderedList my={4}>
                <ListItem>
                  Les formations en apprentissage issues du{" "}
                  <Link
                    href="https://catalogue-apprentissage.intercariforef.org/"
                    aria-label="Accéder au catalogue des formations intercarif oref - nouvelle fenêtre"
                    isExternal
                    variant="basicUnderlinedBlue"
                  >
                    catalogue des formations en apprentissage du Réseau des Carif-Oref <ExternalLinkIcon mb="3px" ml="2px" />
                  </Link>
                  .
                </ListItem>
                <ListItem>
                  De nombreuses offres d’emploi en alternance : celles postées par les recruteurs directement sur notre plateforme, ainsi que sur les sites de nos partenaires (via
                  API ou Widget).
                </ListItem>
                <ListItem>
                  Nous agrégeons également les offres en alternance de France travail et de ses{" "}
                  <Link
                    href="https://www.francetravail.fr/candidat/vos-services-en-ligne/des-partenaires-pour-vous-propos.html"
                    aria-label="Accéder à la liste des sites partenaires de France Travail - nouvelle fenêtre"
                    isExternal
                    variant="basicUnderlinedBlue"
                  >
                    sites partenaires <ExternalLinkIcon mb="3px" ml="2px" />
                  </Link>
                  . Des entreprises identifiées comme à fort potentiel d'embauche en alternance sur la base de données publiques. Notre objectif est de faciliter les démarches de
                  candidatures spontanées des candidats, en pré ciblant les entreprises pertinentes.
                </ListItem>
              </UnorderedList>
              <Text as="span" fontWeight={700}>
                Les organismes de formation
              </Text>{" "}
              en alternance peuvent ainsi faire connaître leurs formations aux candidats, mais également diffuser les offres d’emploi de leurs entreprises partenaires. Par
              ailleurs, nous proposons aux entreprises qui utilisent notre plateforme de partager leurs offres aux organismes de formation, afin que ces derniers puissent les
              diffuser auprès de leurs étudiants.
            </Text>

            <Text variant="editorialContentH2" as="h2">
              Impact observé
            </Text>

            <Text as="p" mb={4}>
              Vous pouvez consulter nos{" "}
              <NextLink legacyBehavior passHref href="/stats" aria-label="Accès aux statistiques">
                <Link variant="basicUnderlinedBlue">statistiques</Link>
              </NextLink>
            </Text>

            <Text as="p" mb={4}>
              La bonne alternance, en collaboration avec ses partenaires, est au carrefour des mondes de la formation et de l’emploi, et ambitionne ainsi d’aider les candidats à
              l'alternance à réaliser leur vocation.
            </Text>

            <Text variant="editorialContentH2" as="h2">
              Nos partenaires
            </Text>

            <SimpleGrid gap={2} mb={4} columns={[2, 3, 4]}>
              <Image src="/images/logosPartenaires/partenaire-France Travail.png" alt="France Travail" />
              <Image src="/images/logosPartenaires/partenaire-Parcoursup.png" alt="Parcoursup" />
              <Image src="/images/logosPartenaires/partenaire-onisep.png" alt="Onisep" />
              <Image src="/images/logosPartenaires/partenaire-portail de lalternance.png" alt="Portail de l'alternance" />
              <Image src="/images/logosPartenaires/partenaire-1j1s.png" alt="un jeune une solution" />
              <Image src="/images/logosPartenaires/partenaire-affelnet.png" alt="affelnet" />
              <Image src="/images/logosPartenaires/partenaire-opco-ocapiat.png" alt="opco ocapiat" />
              <Image src="/images/logosPartenaires/partenaire-opco-2i.png" alt="opco 2i" />
              <Image src="/images/logosPartenaires/partenaire-opco-sante.png" alt="opco santé" />
              <Image src="/images/logosPartenaires/partenaire-opco-atlas.png" alt="opco atlas" />
              <Image src="/images/logosPartenaires/partenaire-opco-afdas.png" alt="opco afdas" />
              <Image src="/images/logosPartenaires/partenaire-opco-ep.png" alt="opco e p" />
              <Image src="/images/logosPartenaires/partenaire-opco-commerce.png" alt="opco commerce" />
              <Image src="/images/logosPartenaires/partenaire-opco-constructys.png" alt="opco constructys" />
              <Image src="/images/logosPartenaires/partenaire-opco-uniformation.png" alt="opco uniformation" />
              <Image src="/images/logosPartenaires/partenaire-opco-akto.png" alt="opco akto" />
              <Image src="/images/logosPartenaires/partenaire-diagoriente.png" alt="Diagoriente" />
              <Image src="/images/logosPartenaires/partenaire-tdb.png" alt="Tableau de bord de l'apprentissage" />
              <Image src="/images/logosPartenaires/partenaire-catalogue.png" alt="Catalogue intercarif oref" />
            </SimpleGrid>

            <Text variant="editorialContentH2" as="h2">
              Qui sommes nous
            </Text>

            <Text as="p" mb={4}>
              D’abord développé par France travail, La bonne alternance a été repris en 2020 par{" "}
              <Link
                href="https://beta.gouv.fr/incubateurs/mission-apprentissage.html"
                aria-label="Accéder au site de la mission interministérielle pour l'apprentissage - nouvelle fenêtre"
                isExternal
                variant="basicUnderlinedBlue"
              >
                la mission interministérielle pour l'apprentissage <ExternalLinkIcon mb="3px" ml="2px" />
              </Link>
              , membre de la communauté{" "}
              <Link href="https://beta.gouv.fr" aria-label="Accéder au site de beta gouv point fr - nouvelle fenêtre" isExternal variant="basicUnderlinedBlue">
                beta.gouv.fr <ExternalLinkIcon mb="3px" ml="2px" />
              </Link>{" "}
              et suit à ce titre une démarche spécifique de conception de services numériques.
            </Text>
          </GridItem>
        </Grid>
      </Container>
      <Box mb={3}>&nbsp;</Box>
    </Box>
    <Footer />
  </div>
)

export default APropos
