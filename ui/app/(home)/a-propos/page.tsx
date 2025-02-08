import { Box, Container, Divider, Grid, GridItem, ListItem, SimpleGrid, Text, UnorderedList } from "@chakra-ui/react"
import type { Metadata } from "next"
import Image from "next/image"

import Breadcrumb from "@/app/components/Breadcrumb"
import { DsfrLink } from "@/components/dsfr/DsfrLink"
import j1s from "@/public/images/logosPartenaires/partenaire-1j1s.webp"
import affelnet from "@/public/images/logosPartenaires/partenaire-affelnet.webp"
import catalogue from "@/public/images/logosPartenaires/partenaire-catalogue.webp"
import diagoriente from "@/public/images/logosPartenaires/partenaire-diagoriente.webp"
import franceTravail from "@/public/images/logosPartenaires/partenaire-france-travail.webp"
import onisep from "@/public/images/logosPartenaires/partenaire-onisep.webp"
import opco2i from "@/public/images/logosPartenaires/partenaire-opco-2i.webp"
import afdas from "@/public/images/logosPartenaires/partenaire-opco-afdas.webp"
import akto from "@/public/images/logosPartenaires/partenaire-opco-akto.webp"
import atlas from "@/public/images/logosPartenaires/partenaire-opco-atlas.webp"
import commerce from "@/public/images/logosPartenaires/partenaire-opco-commerce.webp"
import constructys from "@/public/images/logosPartenaires/partenaire-opco-constructys.webp"
import ep from "@/public/images/logosPartenaires/partenaire-opco-ep.webp"
import ocapiat from "@/public/images/logosPartenaires/partenaire-opco-ocapiat.webp"
import sante from "@/public/images/logosPartenaires/partenaire-opco-sante.webp"
import uniformation from "@/public/images/logosPartenaires/partenaire-opco-uniformation.webp"
import parcoursup from "@/public/images/logosPartenaires/partenaire-parcoursup.webp"
import portailAlternance from "@/public/images/logosPartenaires/partenaire-portail-alternance.webp"
import tbd from "@/public/images/logosPartenaires/partenaire-tdb.webp"
import { PAGES } from "@/utils/routes.utils"

export const metadata: Metadata = {
  title: PAGES.static.aPropos.getMetadata().title,
  description: PAGES.static.aPropos.getMetadata().description,
}

export default function APropos() {
  return (
    <div>
      <Box as="main">
        <Breadcrumb pages={[PAGES.static.aPropos]} />
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
                L’alternance est une formule pleine de promesses pour les entreprises et les étudiants, car elle assure une formation proche des métiers et de la réalité du marché
                du travail. Pourtant le triptyque formation-entreprise-candidat est souvent complexe à mettre en oeuvre pour que l’alternance soit un succès.
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
                , nous proposons un dépôt d’offre simplifié, permettant d’exprimer un besoin de recrutement en alternance en moins d'une minute. Recruter en alternance est souvent
                un sujet compliqué pour les PME et TPE. Le manque de ressources et de connaissances en font un tâche peu prioritaire. D’ailleurs, 7 employeurs sur 10 recrutent sans
                déposer d’offre d’emploi.
              </Text>

              <Text as="p" mb={4}>
                <Text as="span" fontWeight={700}>
                  Nous aidons les candidats
                </Text>{" "}
                intéressés par l'alternance à trouver une formation d’une part, et un contrat avec une entreprise d’autre part, en exposant et permettant aux candidat d'entrer en
                contact avec :
                <UnorderedList my={4} spacing={6}>
                  <ListItem>
                    Les formations en apprentissage issues du{" "}
                    <DsfrLink href="https://catalogue-apprentissage.intercariforef.org/" aria-label="Accéder au catalogue des formations intercarif oref - nouvelle fenêtre">
                      catalogue des formations en apprentissage du Réseau des Carif-Oref
                    </DsfrLink>
                    .
                  </ListItem>
                  <ListItem>
                    De nombreuses offres d’emploi en alternance : celles postées par les recruteurs directement sur notre plateforme, ainsi que sur les sites de nos partenaires
                    (via API ou Widget, cf.{" "}
                    <DsfrLink href="/espace-developpeurs" aria-label="Accès à l'espace développeurs">
                      Espace développeurs
                    </DsfrLink>
                    ).
                  </ListItem>
                  <ListItem>
                    Nous agrégeons également les offres en alternance de France travail et de ses{" "}
                    <DsfrLink
                      href="https://www.francetravail.fr/candidat/vos-services-en-ligne/des-partenaires-pour-vous-propos.html"
                      aria-label="Accéder à la liste des sites partenaires de France Travail - nouvelle fenêtre"
                    >
                      sites partenaires
                    </DsfrLink>
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
                <DsfrLink href="/stats" aria-label="Accès aux statistiques">
                  statistiques
                </DsfrLink>
              </Text>

              <Text as="p" mb={4}>
                La bonne alternance, en collaboration avec ses partenaires, est au carrefour des mondes de la formation et de l’emploi, et ambitionne ainsi d’aider les candidats à
                l'alternance à réaliser leur vocation.
              </Text>

              <Text variant="editorialContentH2" as="h2">
                Nos partenaires
              </Text>

              <SimpleGrid gap={2} mb={4} columns={[2, 3, 4]}>
                <Image src={franceTravail} alt="France Travail" />
                <Image src={parcoursup} alt="Parcoursup" />
                <Image src={onisep} alt="Onisep" />
                <Image src={portailAlternance} alt="Portail de l'alternance" />
                <Image src={j1s} alt="un jeune une solution" />
                <Image src={affelnet} alt="affelnet" />
                <Image src={ocapiat} alt="opco ocapiat" />
                <Image src={opco2i} alt="opco 2i" />
                <Image src={sante} alt="opco santé" />
                <Image src={atlas} alt="opco atlas" />
                <Image src={afdas} alt="opco afdas" />
                <Image src={ep} alt="opco ep" />
                <Image src={commerce} alt="opco commerce" />
                <Image src={constructys} alt="opco constructys" />
                <Image src={uniformation} alt="opco uniformation" />
                <Image src={akto} alt="opco akto" />
                <Image src={diagoriente} alt="Diagoriente" />
                <Image src={tbd} alt="Tableau de bord de l'apprentissage" />
                <Image src={catalogue} alt="Catalogue intercarif oref" />
              </SimpleGrid>

              <Text variant="editorialContentH2" as="h2">
                Qui sommes nous
              </Text>

              <Text as="p" mb={4}>
                D’abord développé par France travail, La bonne alternance a été repris en 2020 par{" "}
                <DsfrLink
                  href="https://beta.gouv.fr/incubateurs/mission-apprentissage.html"
                  aria-label="Accéder au site de la mission interministérielle pour l'apprentissage - nouvelle fenêtre"
                >
                  la mission interministérielle pour l'apprentissage
                </DsfrLink>
                , membre de la communauté{" "}
                <DsfrLink href="https://beta.gouv.fr" aria-label="Accéder au site de beta gouv point fr - nouvelle fenêtre">
                  beta.gouv.fr
                </DsfrLink>{" "}
                et suit à ce titre une démarche spécifique de conception de services numériques.
              </Text>
            </GridItem>
          </Grid>
        </Container>
        <Box mb={3}>&nbsp;</Box>
      </Box>
    </div>
  )
}
