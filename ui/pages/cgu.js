import React from "react";
import Navigation from "../components/navigation";
import Breadcrumb from "../components/breadcrumb";
import ScrollToTop from "../components/ScrollToTop";

import { NextSeo } from "next-seo";

import Footer from "../components/footer";
import { Box, Text, Link } from '@chakra-ui/react'

const CGU = () => {
  return (
    <Box>
      <NextSeo
        title="Conditions générales d'utilisation | La bonne alternance | Trouvez votre alternance"
        description="Conditions générales d’utilisation de La bonne alternance."
      />

      <ScrollToTop />
      <Navigation bgcolor="is-white" />

      <Breadcrumb forPage="cgu" label="CGU" />

      <Box className="c-page-container container my-0 mb-sm-5 p-5">
        <Box className="row">
          <Box className="col-12 col-md-5">
            <Box as="h1">
              <Text as="span" display="block" mb={1} variant="editorialContentH1" color="#2a2a2a">Conditions</Text>
              <Text as="span" display="block" mb={1} variant="editorialContentH1">générales</Text>
              <Text as="span" display="block" mb={1} variant="editorialContentH1">d&apos;utilisation</Text>
            </Box>
          </Box>
          <Box className="col-12 col-md-7">
            <Text as="p" mb="3">Dernière mise à jour le : 12/04/2021</Text>
            <Text as="h3" mb="3">Conditions générales d’utilisation de La bonne alternance</Text>
            <Text as="p" mb="3">
              Les présentes conditions générales d’utilisation (dites « CGU ») fixent le cadre juridique de La bonne
              alternance et définissent les conditions d’accès et d’utilisation des services par l’Utilisateur.
            </Text>
            <Box as="section" mb="6">
              <Text as="h2" mb="3" variant="homeEditorialH2">Article 1 - Champ d’application</Text>
              <Text as="p" mb="3">
                Le site est accessible sans création de compte et demeure d’accès libre. L’utilisation du site vaut
                acceptation des présentes CGU.
              </Text>
            </Box>
            <Box as="section" mb="6">
              <Text as="h2" mb="3" variant="homeEditorialH2">Article 2 - Objet</Text>
              <Text as="p" mb="2">
                Le site internet{" "}
                <Link
                  href="https://labonnealternance.pole-emploi.fr/"
                  isExternal
                />{" "}
                a pour objet de faciliter les entrées en alternance des usagers en informant sur les formations en
                apprentissage ainsi que les offres d&apos;emplois et entreprises auprès desquelles adresser une candidature.
              </Text>
              <Text as="p" mb="2">
                L’utilisateur peut filtrer tout ou partie des informations à l’aide des filtres suivants : niveau de
                diplôme préparé, secteur d’emploi et secteur géographique.
              </Text>
            </Box>
            <Box as="section">
              <Text as="h2" mb="3" variant="homeEditorialH2">Article 3 – Définitions</Text>
              <p>L’Utilisateur est toute personne qui utilise le site.</p>
              <p>Les services sont l’ensemble des services proposés par La bonne alternance.</p>
              <p>
                Le responsable de traitement : est la personne qui, au sens de l’article du règlement (UE) n°2016/679 du
                Parlement européen et du Conseil du 27 avril 2016 relatif à la protection des personnes physiques à du
                traitement des données à caractère personnel et à la libre circulation de ces données à caractère
                personnel.
              </p>
            </Box>
            <Box as="section">
              <h2 className="c-faq-question mt-2">Article 4 – Fonctionnalités </h2>

              <p>
                <strong>Recherche de formations et d’entreprises</strong>
              </p>
              <p>
                Le service proposé sur le site labonnealternance.pole-emploi.fr permet à l’utilisateur de rechercher des
                formations et/ou entreprises susceptibles d’embaucher en alternance des profils similaires au sien, en
                fonction des données qu’il a saisies (domaine/métier, niveau de diplôme, secteur géographique).
              </p>
              <p>
                Les résultats de recherche sont accessibles en liste et sur une carte. Ils sont classés en fonction de
                leur proximité géographique par rapport au périmètre défini par l’utilisateur.
              </p>

              <p>
                L’utilisateur peut entrer en contact avec l’entreprise ou l’organisme au moyen des coordonnées indiquées
                sur la fiche de l’entreprise ou de l’organisme, ou directement via les services de candidature et de
                prise de rendez-vous.
              </p>
              <p>
                À tout moment, chaque entreprise peut d’une part s’opposer à ce que son nom apparaisse dans les
                résultats de recherche ou d’autre part, demander à être mise en avant.
              </p>
              <p>
                Elle peut également demander la modification/suppression des informations communiquées (ex. coordonnées)
                sur le site La bonne alternance en remplissant le{" "}
                <Link
                  url="https://labonneboite.pole-emploi.fr/informations-entreprise/action"
                  title="formulaire recruteur"
                />{" "}
                directement depuis la page d’accueil du site.
              </p>
              <p>
                <strong>Envoi de candidature</strong>
              </p>
              <p>
                Le service La bonne alternance permet à des personnes à la recherche d’une alternance d’envoyer des
                candidatures directement à partir du site internet{" "}
                <Link
                  url="https://labonnealternance.pole-emploi.fr/"
                  title="labonnealternance.pole-emploi.fr"
                />
                . Et ce, à l’ensemble des entreprises pour lesquelles un email de contact est connu.
              </p>
              <p>Tous les usagers peuvent accéder à ce service.</p>
              <p>
                Pour envoyer sa candidature, l’utilisateur complète un formulaire (nom, prénom, coordonnées, CV, lettre
                de motivation). La candidature est envoyée à l’entreprise. Hormis les pièces jointes, le détail de
                chaque candidature est stocké par La bonne alternance pendant 12 mois. En outre, les recruteurs peuvent
                télécharger les pièces jointes à la candidature, comme le CV, et les conserver au sein de leur système
                d’information.
              </p>
            </Box>
            <Box as="section">
              <h2 className="c-faq-question mt-2">Article 5 – Responsabilités</h2>
              <p>
                <strong>5.1 L’éditeur du Site</strong>
              </p>
              <p>
                Les sources des informations diffusées sur le site sont réputées fiables mais La bonne alternance ne
                garantit pas qu’il soit exempt de défauts, d’erreurs ou d’omissions.
              </p>
              <p>
                Tout événement dû à un cas de force majeure ayant pour conséquence un dysfonctionnement du site et sous
                réserve de toute interruption ou modification en cas de maintenance, n&apos;engage pas la responsabilité de
                l’éditeur.
              </p>
              <p>
                L’éditeur s’engage à mettre en œuvre toutes mesures appropriées, afin de protéger les données traitées.
              </p>
              <p>
                L’éditeur s’engage à la sécurisation du site, notamment en prenant les mesures nécessaires permettant de
                garantir la sécurité et la confidentialité des informations fournies.
              </p>
              <p>
                L’éditeur fournit les moyens nécessaires et raisonnables pour assurer un accès continu, sans
                contrepartie financière, au site. Il se réserve la liberté de faire évoluer, de modifier ou de
                suspendre, sans préavis, la plateforme pour des raisons de maintenance ou pour tout autre motif jugé
                nécessaire.
              </p>
              <p>
                <strong>5.2 L’Utilisateur</strong>
              </p>
              L’utilisation du site internet{" "}
              <Link url="https://labonnealternance.pole-emploi.fr/" title="labonnealternance.pole-emploi.fr" />{" "}
              est soumise au respect par l’utilisateur :
              <ul>
                <li> de la législation française;</li>
                <li> des présentes conditions d’utilisation;</li>
                <li>
                  Les présentes conditions d’utilisation peuvent être modifiées à tout moment et la date de mise à jour
                  est mentionnée.
                </li>
              </ul>
              <p>
                Toute information transmise par l&apos;Utilisateur est de sa seule responsabilité. Il est rappelé que toute
                personne procédant à une fausse déclaration pour elle-même ou pour autrui s’expose, notamment, aux
                sanctions prévues à l’article 441-1 du code pénal, prévoyant des peines pouvant aller jusqu’à trois ans
                d’emprisonnement et 45 000 euros d’amende.
              </p>
            </Box>
            <Box as="section">
              <h2 className="c-faq-question mt-2">Article 6 - Protection des données à caractère personnel</h2>
              <p>
                L’utilisation du moteur de recherche disponible sur le site internet{" "}
                <Link url="https://labonnealternance.pole-emploi.fr/" title="La bonne alternance" /> nécessite
                d’indiquer le(s) métier(s) recherché(s), le périmètre géographique souhaité et de manière facultative le
                niveau d’études. Ces données sont collectées et traitées par Pôle emploi dans le but de fournir, à la
                requête de l’utilisateur, la liste des entreprises ou organismes ayant un potentiel d’embauche dans un
                secteur d’emploi et géographique donné, une liste de formations en apprentissage dans un secteur
                d’emploi et géographique donné, une liste d’offres d’emploi dans un secteur d’emploi et géographique
                donné.
              </p>
              <p>
                Les données à caractère personnel de l’utilisateur mentionnées ci-dessus sont destinées aux agents de
                Pôle emploi en charge du service de{" "}
                <Link url="https://labonnealternance.pole-emploi.fr/" title="La bonne alternance" />.
              </p>
              <p>
                Pôle emploi traite également des données relatives aux entreprises qui peuvent concerner directement des
                personnes physiques, notamment les coordonnées des interlocuteurs personnes physiques de ces
                entreprises.
              </p>
              <p>
                Les coordonnées de contact mentionnées ci-dessus sont destinées aux agents de Pôle emploi en charge du
                service et aux utilisateurs du service de{" "}
                <Link url="https://labonnealternance.pole-emploi.fr/" title="La bonne alternance" />.
              </p>
              <p>Les données traitées sont conservées pour une durée de 13 mois.</p>
              <p>
                Pôle emploi est le responsable de ce traitement. Au titre de la licéité du traitement exigée par
                l’article 6 du règlement général (UE) sur la protection des données n°2016/679 du 27 avril 2016 (RGPD),
                le fondement juridique du traitement est la mission d’intérêt public dont est investi Pôle emploi en
                vertu de l’article L.5312-1 du code du travail qui consiste notamment à mettre en relation l’offre et la
                demande d’emploi.
              </p>
              <p>
                Conformément aux articles 12 à 23 du règlement général (UE) sur la protection des données n°2016/679 du
                27 avril 2016 et à la loi Informatique et libertés n°78-17 du 6 janvier 1978 modifiée, vous bénéficiez
                d’un droit d’accès, de rectification, de limitation, de définir des directives sur le sort des données
                après votre mort et le droit de porter une réclamation devant la Commission nationale de l’informatique
                et des libertés pour les données vous concernant. Pour exercer vos droits, vous pouvez vous adresser au
                délégué à la protection des données de Pôle emploi (1 avenue du Docteur Gley, 75987 Paris cedex 20) ou à
                l’adresse courriel suivante : <a href="mailto:contact-dpd@pole-emploi.fr">contact-dpd@pole-emploi.fr</a>
                .
              </p>
            </Box>
            <Box as="section">
              <h2 className="c-faq-question mt-2">Article 7 – Mise à jour des conditions d’utilisation</h2>
              <p>
                Les termes des présentes conditions d’utilisation peuvent être amendés à tout moment, sans préavis, en
                fonction des modifications apportées à la plateforme, de l’évolution de la législation ou pour tout
                autre motif jugé nécessaire.
              </p>
            </Box>
            <Box as="section">
              <h2 className="c-faq-question mt-2">Article 8 - Propriété intellectuelle</h2>
              <p>
                Les marques Pôle emploi et La bonne alternance sont protégées au titre des articles L.712-1 et suivants
                du code de la propriété intellectuelle. Toute représentation, reproduction ou diffusion, intégrale ou
                partielle de la marque Pôle emploi et/ou de la marque La bonne alternance, sur quelque support que ce
                soit, sans l&apos;autorisation expresse et préalable de Pôle emploi constitue un acte de contrefaçon,
                sanctionné en application de l’article L.716-1 du même code.
                <br />
                Par ailleurs, le site{" "}
                <Link
                  url="https://labonnealternance.pole-emploi.fr/"
                  title="labonnealternance.pole-emploi.fr"
                />{" "}
                contient des contenus sur lesquels des tiers détiennent des droits de propriété intellectuelle (dessin,
                graphisme, marque, etc.) ou un droit à l’image (photo, visuel mettant en scène une personne physique,
                vidéo, etc.). Les internautes ne sont pas autorisés à réutiliser ces contenus en l’absence de
                l’autorisation préalable et expresse de ces tiers.
              </p>
            </Box>
          </Box>
        </Box>
      </Box>
      <Box className="mb-3">&nbsp;</Box>
      <Footer />
    </Box>
  );
};

export default CGU;
