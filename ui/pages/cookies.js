import { NextSeo } from "next-seo"
import React from "react"
import Breadcrumb from "../components/breadcrumb"
import Navigation from "../components/navigation"
import ScrollToTop from "../components/ScrollToTop"

import { Box, Container, Divider, Grid, GridItem, Link, ListItem, Text, UnorderedList } from "@chakra-ui/react"
import ExternalLink from "../components/externalLink"
import Footer from "../components/footer"

const handleTagCo = (e) => {
  e.preventDefault()
  if (tC?.privacyCenter?.showPrivacyCenter) {
    tC.privacyCenter.showPrivacyCenter()
  } else {
    console.log("Privacy center was required by user.")
  }
  return false
}

const Cookies = () => (
  <Box>
    <NextSeo
      title="Cookies | La bonne alternance | Trouvez votre alternance"
      description="Politique de confidentialité, traitement des données à caractère personnel sur le site de La bonne alternance."
    />

    <ScrollToTop />
    <Navigation />
    <Breadcrumb forPage="cookies" label="Cookies" />

    <Container p={12} my={0} mb={[0, 12]} variant="pageContainer">
      <Grid templateColumns="repeat(12, 1fr)">
        <GridItem px={4} colSpan={[12, 12, 12, 5]}>
          <Box as="h1">
            <Text as="span" display="block" mb={1} variant="editorialContentH1" color="#2a2a2a">
              Cookies
            </Text>
            <Text as="span" display="block" mb={1} variant="editorialContentH1">
              et autres traceurs
            </Text>
          </Box>
          <Divider variant="pageTitleDivider" my={12} />
        </GridItem>
        <GridItem px={4} colSpan={[12, 12, 12, 7]}>
          <Box>
            <Text as="h2" mb="3" variant="homeEditorialH2">
              1. Qu&apos;est-ce qu&apos;un cookie ?
            </Text>
            <Text as="p" mb="2">
              Un cookie est un petit fichier texte déposé sur le terminal des utilisateurs (par exemple un ordinateur, une tablette, un « Smartphone», etc.) lors de la visite d’un
              site internet.
            </Text>
            <Text as="p" mb="2">
              Il contient plusieurs données : le nom du serveur qui l’a déposé, un identifiant sous forme de numéro unique, et une date d’expiration. Les cookies ont différentes
              fonctionnalités. Ils ont pour but d’enregistrer les paramètres de langue d’un site, de collecter des informations relatives à votre navigation sur les sites,
              d’adresser des services personnalisés, etc.
            </Text>
            <Text as="p" mb="2">
              Seul l’émetteur d’un cookie est susceptible de lire, enregistrer ou de modifier les informations qui y sont contenues.
            </Text>

            <Text as="h2" mt="5" mb="3" variant="homeEditorialH2">
              2. Les cookies déposés sur le site
            </Text>
            <Text as="h3" mb="2" variant="homeEditorialH2" fontSize={{ base: "22px" }}>
              Cookies strictement nécessaires au fonctionnement du site
            </Text>
            <Text as="p" mb="2">
              Des cookies sont utilisés sur le site{" "}
              <Link href="https://labonnealternance.beta.gouv.fr/" aria-label="Redirection vers la page d'accueil" title="La bonne alternance" /> permettre le bon fonctionnement du
              site internet et l’utilisation des principales fonctionnalités du site.
            </Text>
            <Text as="p" mb="2">
              Ces cookies ne sont pas soumis au consentement de l’utilisateur. Ils permettent par exemple le maintien de la connexion ou la conservation du choix de l’usager sur le
              dépôt des cookies. Sans ces cookies, l’utilisation du site peut être dégradée et l’accès à certains services être rendu impossible. Il est déconseillé de les
              désactiver.
            </Text>
            <Text as="p" mb="2">
              L’utilisateur peut cependant s’opposer à leur dépôt en suivant les indications données au point 3.
            </Text>

            <Text as="h3" mb="2" mt="4" variant="homeEditorialH2" fontSize={{ base: "22px" }}>
              Cookies statistiques ou de mesure d’audience
            </Text>
            <Text as="p" mb="2">
              Des cookies sont utilisés sur le site{" "}
              <Link href="https://labonnealternance.apprentissage.beta.gouv.fr/" isExternal>
                La bonne alternance
              </Link>{" "}
              afin d’effectuer de la mesure d’audience, des analyses statistiques dans le but d&apos;améliorer l&apos;expérience utilisateur et la performance du site internet. Ces
              cookies sont déposés par des tiers pour le compte de Pôle emploi.
            </Text>
            <Text as="p" mb="2">
              Concernant le dépôt des cookies Google Analytics et Google Optimize, la société Google collecte par l’intermédiaire de ce cookie des données pour son propre compte
              dans les conditions définies dans sa politique de confidentialité accessible par le lien suivant :{" "}
              <Link href="https://policies.google.com/technologies/partner-sites?gl=fr" aria-label="Accès à la politique de confidentialité Google" isExternal>
                https://policies.google.com/technologies/partner-sites?gl=fr
              </Link>{" "}
            </Text>
            <Text as="p" mb="2">
              L’utilisateur peut paramétrer le dépôt des cookies en suivant les indications données au point 3. Le fait de refuser la mise en œuvre de tels cookies n&apos;a pas
              d&apos;incidence sur la navigation sur le site.
            </Text>
            <Text as="p" mb="2">
              Pour plus d’informations sur les cookies notamment sur le type de cookies déposés ainsi que leurs finalités précises, vous pouvez consulter la plateforme de gestion
              du consentement,{" "}
              <Link href="#" aria-label="Accès à la pop-in de gestion des cookies" onClick={handleTagCo}>
                {" "}
                disponible ici{" "}
              </Link>
              .
            </Text>

            <Text as="h2" mt="5" mb="3" variant="homeEditorialH2">
              3. Accepter ou refuser les cookies
            </Text>
            <Text as="p" mb="2">
              L’utilisateur dispose de différents moyens pour gérer ses choix en matière de cookies. Les modalités de gestion diffèrent selon que le cookie est soumis ou non à
              consentement préalable. L’utilisateur peut modifier ses choix à tout moment. Pour information, le paramétrage des cookies est susceptible de modifier les conditions
              de navigation sur le site internet{" "}
              <ExternalLink url="https://labonnealternance.apprentissage.beta.gouv.fr/" aria-label="Redirection vers la page d'accueil" title="La bonne alternance" />, ainsi que
              les conditions d’accès à certains services et d’entrainer des dysfonctionnements de certaines fonctionnalités.
            </Text>

            <Text as="h3" mb="2" mt="4" variant="homeEditorialH2" fontSize={{ base: "22px" }}>
              Cookies statistiques ou de mesure d’audience
            </Text>
            <Text as="p" mb="2">
              Pour les cookies donnant lieu à consentement préalable, l’utilisateur peut accepter ou refuser le dépôt de tout ou partie des cookies, à tout moment, en formulant des
              choix sur la plateforme de gestion du consentement via{" "}
              <Link href="#" aria-label="Accès à la pop-in de gestion des cookies" onClick={handleTagCo}>
                ce lien dédié{" "}
              </Link>
              .
            </Text>

            <Text as="h3" mb="2" mt="4" variant="homeEditorialH2" fontSize={{ base: "22px" }}>
              Le paramétrage du navigateur
            </Text>
            <Text as="p" mb="2">
              L’utilisateur peut accepter ou refuser le dépôt de tout ou partie des cookies, à tout moment, en modifiant les paramètres de son navigateur (consulter la fonction «
              Aide » du navigateur pour en savoir plus) ou en se rendant sur l’une des pages suivantes, selon le navigateur utilisé :
            </Text>
            <UnorderedList>
              <ListItem>
                Google Chrome :{" "}
                <Link href="https://support.google.com/chrome/answer/95647?hl=fr" isExternal aria-label="Accès au site support de Google Chrome">
                  (https://support.google.com/chrome/answer/95647?hl=fr)
                </Link>
              </ListItem>
              <ListItem>
                Mozilla Firefox :{" "}
                <Link href="https://support.mozilla.org/fr/kb/activer-desactiver-cookies" isExternal aria-label="Accès au site support de Internet explorer">
                  (https://support.mozilla.org/fr/kb/activer-desactiver-cookies)
                </Link>
              </ListItem>
              <ListItem>
                Internet Explorer :{" "}
                <Link href="https://support.microsoft.com/fr-fr/help/17442" isExternal aria-label="Accès au site support de Mozilla firefox">
                  (https://support.microsoft.com/fr-fr/help/17442)
                </Link>
              </ListItem>
              <ListItem>
                Safari :{" "}
                <Link href="https://support.apple.com/fr-fr/guide/safari/sfri11471/mac" isExternal aria-label="Accès au site support de Safari">
                  (https://support.apple.com/fr-fr/guide/safari/sfri11471/mac)
                </Link>
              </ListItem>
            </UnorderedList>

            <Text as="p" mb="2">
              Pour information, la plupart des navigateurs acceptent par défaut le dépôt de cookies. L’utilisateur peut modifier ses choix en matière de cookies à tout moment. Le
              paramétrage des cookies est susceptible de modifier les conditions de navigation sur le site internet, ainsi que les conditions d’accès à certains services, et
              d&apos;entraîner des dysfonctionnements de certaines fonctionnalités.
            </Text>

            <Text as="p" mb="2">
              Pour plus d’informations sur les cookies et les moyens permettant d’empêcher leur installation, l’utilisateur peut se rendre sur la page dédiée sur le site internet
              de la CNIL :{" "}
              <Link
                aria-label="Accès au site de la Commission nationale de l'informatique et des libertés"
                href="https://www.cnil.fr/fr/cookies-les-outils-pour-les-maitriser"
                isExternal
              >
                https://www.cnil.fr/fr/cookies-les-outils-pour-les-maitriser
              </Link>
              .
            </Text>
          </Box>
        </GridItem>
      </Grid>
    </Container>
    <Footer />
  </Box>
)

export default Cookies
