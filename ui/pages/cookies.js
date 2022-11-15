import React from "react";
import Navigation from "../components/navigation";
import ScrollToTop from "../components/ScrollToTop";
import Breadcrumb from "../components/breadcrumb";
import { NextSeo } from "next-seo";

import Footer from "../components/footer";
import ExternalLink from "../components/externalLink";
import { Box, Text, Link, UnorderedList, ListItem, Container, Divider, Grid, GridItem, Spinner } from '@chakra-ui/react'

const handleTagCo = (e) => {
  e.preventDefault();
  if (tC?.privacyCenter?.showPrivacyCenter) {
    tC.privacyCenter.showPrivacyCenter();
  } else {
    console.log("Privacy center was required by user.");
  }
  return false;
};

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
          <Box as="h1" >
            <Text as="span" display="block" mb={1} variant="editorialContentH1" color="#2a2a2a">Cookies</Text>
            <Text as="span" display="block" mb={1} variant="editorialContentH1">et autres traceurs</Text>
          </Box>
          <Divider variant="pageTitleDivider" my={12} />
        </GridItem>
        <GridItem px={4} colSpan={[12, 12, 12, 7]}>
          <Box>
            <Text as="h2" mb="3" variant="homeEditorialH2">1. Qu&apos;est-ce qu&apos;un cookie ?</Text>
            <Text as="p" mb="2">
              Un cookie est un petit fichier texte déposé sur le terminal des utilisateurs (par exemple un ordinateur,
              une tablette, un « Smartphone», etc.) lors de la visite d’un site internet.
            </Text>
            <Text as="p" mb="2">
              Il contient plusieurs données : le nom du serveur qui l’a déposé, un identifiant sous forme de numéro
              unique, et une date d’expiration. Les cookies ont différentes fonctionnalités. Ils ont pour but
              d’enregistrer les paramètres de langue d’un site, de collecter des informations relatives à votre
              navigation sur les sites, d’adresser des services personnalisés, etc.
            </Text>
            <Text as="p" mb="2">
                Seul l’émetteur d’un cookie est susceptible de lire, enregistrer ou de modifier les informations qui y
                sont contenues.
            </Text>

            <h2 className="h3 c-faq-question">2. Les cookies déposés sur le site</h2>
            <h3 className="h4 c-faq-question-small mt-4">Cookies strictement nécessaires au fonctionnement du site</h3>
            <p className="mt-3">
              <span className="d-block">
                Des cookies sont utilisés sur le site{" "}
                <ExternalLink url="https://labonnealternance.pole-emploi.fr/" title="La bonne alternance" /> permettre le
                bon fonctionnement du site internet et l’utilisation des principales fonctionnalités du site.
              </span>
            </p>
            <p>
              <span className="d-block">
                Ces cookies ne sont pas soumis au consentement de l’utilisateur. Ils permettent par exemple le maintien de
                la connexion ou la conservation du choix de l’usager sur le dépôt des cookies. Sans ces cookies,
                l’utilisation du site peut être dégradée et l’accès à certains services être rendu impossible. Il est
                déconseillé de les désactiver.
              </span>
            </p>
            <p>
              <span className="d-block">
                L’utilisateur peut cependant s’opposer à leur dépôt en suivant les indications données au point 3.
              </span>
            </p>

            <h3 className="h4 c-faq-question-small mt-4">Cookies statistiques ou de mesure d’audience</h3>
            <p>
              <span className="d-block">
                Des cookies sont utilisés sur le site{" "}
                <ExternalLink url="https://labonnealternance.pole-emploi.fr/" title="La bonne alternance" /> afin
                d’effectuer de la mesure d’audience, des analyses statistiques dans le but d&apos;améliorer l&apos;expérience
                utilisateur et la performance du site internet. Ces cookies sont déposés par des tiers pour le compte de
                Pôle emploi.
              </span>
            </p>
            <p>
              <span className="d-block">
                Concernant le dépôt des cookies Google Analytics et Google Optimize, la société Google collecte par
                l’intermédiaire de ce cookie des données pour son propre compte dans les conditions définies dans sa
                politique de confidentialité accessible par le lien suivant :{" "}
                <ExternalLink
                  url="https://policies.google.com/technologies/partner-sites?gl=fr"
                  title="https://policies.google.com/technologies/partner-sites?gl=fr"
                />{" "}
              </span>
            </p>
            <p>
              <span className="d-block">
                L’utilisateur peut paramétrer le dépôt des cookies en suivant les indications données au point 3. Le fait
                de refuser la mise en œuvre de tels cookies n&apos;a pas d&apos;incidence sur la navigation sur le site.
              </span>
            </p>
            <p>
              <span className="d-block">
                Pour plus d’informations sur les cookies notamment sur le type de cookies déposés ainsi que leurs
                finalités précises, vous pouvez consulter la plateforme de gestion du consentement,{" "}
                <a href="#" onClick={handleTagCo}>
                  {" "}
                  disponible ici{" "}
                </a>
                .
              </span>
            </p>

            <h2 className="h3 c-faq-question">3. Accepter ou refuser les cookies</h2>
            <p>
              <span className="d-block">
                L’utilisateur dispose de différents moyens pour gérer ses choix en matière de cookies. Les modalités de
                gestion diffèrent selon que le cookie est soumis ou non à consentement préalable. L’utilisateur peut
                modifier ses choix à tout moment. Pour information, le paramétrage des cookies est susceptible de modifier
                les conditions de navigation sur le site internet{" "}
                <ExternalLink url="https://labonnealternance.pole-emploi.fr/" title="La bonne alternance" />, ainsi que
                les conditions d’accès à certains services et d’entrainer des dysfonctionnements de certaines
                fonctionnalités.
              </span>
            </p>

            <h3 className="h4 c-faq-question-small">Cookies statistiques ou de mesure d’audience</h3>
            <p>
              <span className="d-block">
                Pour les cookies donnant lieu à consentement préalable, l’utilisateur peut accepter ou refuser le dépôt de
                tout ou partie des cookies, à tout moment, en formulant des choix sur la plateforme de gestion du
                consentement via{" "}
                <a href="#" onClick={handleTagCo}>
                  {" "}
                  ce lien dédié{" "}
                </a>
                .
              </span>
            </p>

            <h3 className="h4 c-faq-question-small">Le paramétrage du navigateur</h3>
            <p>
              <span className="d-block">
                L’utilisateur peut accepter ou refuser le dépôt de tout ou partie des cookies, à tout moment, en modifiant
                les paramètres de son navigateur (consulter la fonction « Aide » du navigateur pour en savoir plus) ou en
                se rendant sur l’une des pages suivantes, selon le navigateur utilisé :
              </span>
            </p>
            <li>
              Google Chrome :{" "}
              <ExternalLink
                url="https://support.google.com/chrome/answer/95647?hl=fr"
                title="(https://support.google.com/chrome/answer/95647?hl=fr)"
              />
            </li>
            <li>
              Internet Explorer :{" "}
              <ExternalLink
                url="https://support.microsoft.com/fr-fr/help/17442"
                title="(https://support.microsoft.com/fr-fr/help/17442)"
              />
            </li>
            <li>
              Mozilla Firefox :{" "}
              <ExternalLink
                url="https://support.mozilla.org/fr/kb/activer-desactiver-cookies"
                title="(https://support.mozilla.org/fr/kb/activer-desactiver-cookies)"
              />
            </li>
            <li>
              Safari :{" "}
              <ExternalLink
                url="https://support.apple.com/fr-fr/guide/safari/sfri11471/mac"
                title="(https://support.apple.com/fr-fr/guide/safari/sfri11471/mac)"
              />
            </li>

            <p className="mt-3">
              <span className="d-block">
                Pour information, la plupart des navigateurs acceptent par défaut le dépôt de cookies. L’utilisateur peut
                modifier ses choix en matière de cookies à tout moment. Le paramétrage des cookies est susceptible de
                modifier les conditions de navigation sur le site internet, ainsi que les conditions d’accès à certains
                services, et d&apos;entraîner des dysfonctionnements de certaines fonctionnalités.
              </span>
            </p>
            <p>
              <span className="d-block">
                Pour plus d’informations sur les cookies et les moyens permettant d’empêcher leur installation,
                l’utilisateur peut se rendre sur la page dédiée sur le site internet de la CNIL :{" "}
                <ExternalLink
                  url="https://www.cnil.fr/fr/cookies-les-outils-pour-les-maitriser"
                  title="https://www.cnil.fr/fr/cookies-les-outils-pour-les-maitriser"
                />
                .
              </span>
            </p>
          </Box>
        </GridItem>
      </Grid>
    </Container>
    <div className="c-page-container container my-0 mb-sm-5 p-5">
      <div className="row">
        <div className="col-12 col-md-5">
          <h1>
            <span className="d-block c-page-title is-color-2">Cookies</span>
            <span className="d-block c-page-title is-color-2">et autres traceurs</span>
          </h1>
          <hr className="c-page-title-separator" align="left" />
        </div>
        <div className="col-12 col-md-7">
          <h2 className="h3 c-faq-question">1. Qu&apos;est-ce qu&apos;un cookie ?</h2>
          <p>
            <span className="d-block">
              Un cookie est un petit fichier texte déposé sur le terminal des utilisateurs (par exemple un ordinateur,
              une tablette, un « Smartphone», etc.) lors de la visite d’un site internet.
            </span>
          </p>
          <p>
            <span className="d-block">
              Il contient plusieurs données : le nom du serveur qui l’a déposé, un identifiant sous forme de numéro
              unique, et une date d’expiration. Les cookies ont différentes fonctionnalités. Ils ont pour but
              d’enregistrer les paramètres de langue d’un site, de collecter des informations relatives à votre
              navigation sur les sites, d’adresser des services personnalisés, etc.
            </span>
          </p>
          <p>
            <span className="d-block">
              Seul l’émetteur d’un cookie est susceptible de lire, enregistrer ou de modifier les informations qui y
              sont contenues.
            </span>
          </p>

          <h2 className="h3 c-faq-question">2. Les cookies déposés sur le site</h2>
          <h3 className="h4 c-faq-question-small mt-4">Cookies strictement nécessaires au fonctionnement du site</h3>
          <p className="mt-3">
            <span className="d-block">
              Des cookies sont utilisés sur le site{" "}
              <ExternalLink url="https://labonnealternance.pole-emploi.fr/" title="La bonne alternance" /> permettre le
              bon fonctionnement du site internet et l’utilisation des principales fonctionnalités du site.
            </span>
          </p>
          <p>
            <span className="d-block">
              Ces cookies ne sont pas soumis au consentement de l’utilisateur. Ils permettent par exemple le maintien de
              la connexion ou la conservation du choix de l’usager sur le dépôt des cookies. Sans ces cookies,
              l’utilisation du site peut être dégradée et l’accès à certains services être rendu impossible. Il est
              déconseillé de les désactiver.
            </span>
          </p>
          <p>
            <span className="d-block">
              L’utilisateur peut cependant s’opposer à leur dépôt en suivant les indications données au point 3.
            </span>
          </p>

          <h3 className="h4 c-faq-question-small mt-4">Cookies statistiques ou de mesure d’audience</h3>
          <p>
            <span className="d-block">
              Des cookies sont utilisés sur le site{" "}
              <ExternalLink url="https://labonnealternance.pole-emploi.fr/" title="La bonne alternance" /> afin
              d’effectuer de la mesure d’audience, des analyses statistiques dans le but d&apos;améliorer l&apos;expérience
              utilisateur et la performance du site internet. Ces cookies sont déposés par des tiers pour le compte de
              Pôle emploi.
            </span>
          </p>
          <p>
            <span className="d-block">
              Concernant le dépôt des cookies Google Analytics et Google Optimize, la société Google collecte par
              l’intermédiaire de ce cookie des données pour son propre compte dans les conditions définies dans sa
              politique de confidentialité accessible par le lien suivant :{" "}
              <ExternalLink
                url="https://policies.google.com/technologies/partner-sites?gl=fr"
                title="https://policies.google.com/technologies/partner-sites?gl=fr"
              />{" "}
            </span>
          </p>
          <p>
            <span className="d-block">
              L’utilisateur peut paramétrer le dépôt des cookies en suivant les indications données au point 3. Le fait
              de refuser la mise en œuvre de tels cookies n&apos;a pas d&apos;incidence sur la navigation sur le site.
            </span>
          </p>
          <p>
            <span className="d-block">
              Pour plus d’informations sur les cookies notamment sur le type de cookies déposés ainsi que leurs
              finalités précises, vous pouvez consulter la plateforme de gestion du consentement,{" "}
              <a href="#" onClick={handleTagCo}>
                {" "}
                disponible ici{" "}
              </a>
              .
            </span>
          </p>

          <h2 className="h3 c-faq-question">3. Accepter ou refuser les cookies</h2>
          <p>
            <span className="d-block">
              L’utilisateur dispose de différents moyens pour gérer ses choix en matière de cookies. Les modalités de
              gestion diffèrent selon que le cookie est soumis ou non à consentement préalable. L’utilisateur peut
              modifier ses choix à tout moment. Pour information, le paramétrage des cookies est susceptible de modifier
              les conditions de navigation sur le site internet{" "}
              <ExternalLink url="https://labonnealternance.pole-emploi.fr/" title="La bonne alternance" />, ainsi que
              les conditions d’accès à certains services et d’entrainer des dysfonctionnements de certaines
              fonctionnalités.
            </span>
          </p>

          <h3 className="h4 c-faq-question-small">Cookies statistiques ou de mesure d’audience</h3>
          <p>
            <span className="d-block">
              Pour les cookies donnant lieu à consentement préalable, l’utilisateur peut accepter ou refuser le dépôt de
              tout ou partie des cookies, à tout moment, en formulant des choix sur la plateforme de gestion du
              consentement via{" "}
              <a href="#" onClick={handleTagCo}>
                {" "}
                 ce lien dédié{" "}
              </a>
              .
            </span>
          </p>

          <h3 className="h4 c-faq-question-small">Le paramétrage du navigateur</h3>
          <p>
            <span className="d-block">
              L’utilisateur peut accepter ou refuser le dépôt de tout ou partie des cookies, à tout moment, en modifiant
              les paramètres de son navigateur (consulter la fonction « Aide » du navigateur pour en savoir plus) ou en
              se rendant sur l’une des pages suivantes, selon le navigateur utilisé :
            </span>
          </p>
          <li>
            Google Chrome :{" "}
            <ExternalLink
              url="https://support.google.com/chrome/answer/95647?hl=fr"
              title="(https://support.google.com/chrome/answer/95647?hl=fr)"
            />
          </li>
          <li>
            Internet Explorer :{" "}
            <ExternalLink
              url="https://support.microsoft.com/fr-fr/help/17442"
              title="(https://support.microsoft.com/fr-fr/help/17442)"
            />
          </li>
          <li>
            Mozilla Firefox :{" "}
            <ExternalLink
              url="https://support.mozilla.org/fr/kb/activer-desactiver-cookies"
              title="(https://support.mozilla.org/fr/kb/activer-desactiver-cookies)"
            />
          </li>
          <li>
            Safari :{" "}
            <ExternalLink
              url="https://support.apple.com/fr-fr/guide/safari/sfri11471/mac"
              title="(https://support.apple.com/fr-fr/guide/safari/sfri11471/mac)"
            />
          </li>

          <p className="mt-3">
            <span className="d-block">
              Pour information, la plupart des navigateurs acceptent par défaut le dépôt de cookies. L’utilisateur peut
              modifier ses choix en matière de cookies à tout moment. Le paramétrage des cookies est susceptible de
              modifier les conditions de navigation sur le site internet, ainsi que les conditions d’accès à certains
              services, et d&apos;entraîner des dysfonctionnements de certaines fonctionnalités.
            </span>
          </p>
          <p>
            <span className="d-block">
              Pour plus d’informations sur les cookies et les moyens permettant d’empêcher leur installation,
              l’utilisateur peut se rendre sur la page dédiée sur le site internet de la CNIL :{" "}
              <ExternalLink
                url="https://www.cnil.fr/fr/cookies-les-outils-pour-les-maitriser"
                title="https://www.cnil.fr/fr/cookies-les-outils-pour-les-maitriser"
              />
              .
            </span>
          </p>
        </div>
      </div>
    </div>
    <div className="mb-3">&nbsp;</div>
    <Footer />
  </Box>
);

export default Cookies;
