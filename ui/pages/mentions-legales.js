import { NextSeo } from "next-seo"
import React from "react"
import Breadcrumb from "../components/breadcrumb"
import Navigation from "../components/navigation"
import ScrollToTop from "../components/ScrollToTop"

import ExternalLink from "../components/externalLink"
import Footer from "../components/footer"

import { Box, Divider, Container, Grid, GridItem, Text, Link } from "@chakra-ui/react"

const MentionsLegales = () => (
  <Box>
    <NextSeo title="Mentions Légales | La bonne alternance | Trouvez votre alternance" description="Mentions légales du site." />
    <ScrollToTop />
    <Navigation />
    <Breadcrumb forPage="mentions-legales" label="Mentions légales" />

    <Container p={12} my={0} mb={[0, 12]} variant="pageContainer">
      <Grid templateColumns="repeat(12, 1fr)">
        <GridItem px={4} colSpan={[12, 12, 12, 5]}>
          <Box as="h1">
            <Text as="span" display="block" mb={1} variant="editorialContentH1">
              Mentions légales
            </Text>
          </Box>
          <Divider variant="pageTitleDivider" my={12} />
        </GridItem>
        <GridItem px={4} colSpan={[12, 12, 12, 7]}>
          <Box className="">
            <Text as="p" mb="3">
              Dernière mise à jour le : 06/04/2021
            </Text>
            <Text as="h2" mb="2" mt="5" variant="homeEditorialH2">
              Éditeur du site
            </Text>
            <Text as="p" mb="3">
              Le site La bonne alternance est édité par Pôle Emploi, situé :<br />
              15 avenue du Docteur Gley
              <br />
              75987 Paris cedex 20
              <br />
              Tél. :{" "}
              <Link variant="editorialContentLink" href="tel:+33140306000" aria-label="Appel du numéro +33140306000" title="01 40 30 60 00" >01 40 30 60 00</Link>
              <br />
            </Text>

            <Text as="h2" mb="2" mt="5" variant="homeEditorialH2">
              Directeur de la publication
            </Text>
            <Text as="p" mb="3">
              Monsieur Jean Bassères, Directeur Général.
            </Text>

            <Text as="h2" mb="2" mt="5" variant="homeEditorialH2">
              Hébergement du site
            </Text>
            <Text as="p" mb="3">
              Ce site est hébergé par OVH :<br />
              2 rue Kellermann
              <br />
              59100 Roubaix
              <br />
              Tél. :{" "}
              <Link variant="editorialContentLink" href="tel:+33972101007" aria-label="Appel du numéro +33972101007" title="09 72 10 10 07" >09 72 10 10 07</Link>
            </Text>

            <Text as="h2" mb="2" mt="5" variant="homeEditorialH2">
              Accessibilité
            </Text>
            <Text as="p" mb="3">
              L&apos;initiative internationale pour l&apos;accessibilité du Web (Web Accessiblility Initiative) définit l&apos;accessibilité du Web comme suit :
            </Text>
            <Text as="p" mb="3">
              L&apos;accessibilité du Web signifie que les personnes en situation de handicap peuvent utiliser le Web. Plus précisément, qu&apos;elles peuvent percevoir, comprendre,
              naviguer et interagir avec le Web, et qu&apos;elles peuvent contribuer sur le Web. L&apos;accessibilité du Web bénéficie aussi à d&apos;autres, notamment les personnes
              âgées dont les capacités changent avec l&apos;âge. L&apos;accessibilité du Web comprend tous les handicaps qui affectent l&apos;accès au Web, ce qui inclut les
              handicaps visuels, auditifs, physiques, de paroles, cognitives et neurologiques.
            </Text>
            <Text as="p" mb="3">
              L&apos;article 47 de la loi n° 2005-102 du 11 février 2005 pour l&apos;égalité des droits et des chances, la participation et la citoyenneté des personnes handicapées
              fait de l&apos;accessibilité une exigence pour tous les services de communication publique en ligne de l&apos;État, les collectivités territoriales et les
              établissements publics qui en dépendent.
            </Text>
            <Text as="p" mb="3">
              Il stipule que les informations diffusées par ces services doivent être accessibles à tous.
            </Text>
            <Text as="p" mb="3">
              Le référentiel général d&apos;accessibilité pour les administrations (RGAA) rendra progressivement accessible l&apos;ensemble des informations fournies par ces
              services.
            </Text>
            <Text as="p" mb="3">
              Le site La bonne alternance est en cours d&apos;optimisation afin de le rendre conforme au{" "}
              <Link variant="editorialContentLink"
                href="https://www.numerique.gouv.fr/publications/rgaa-accessibilite"
                aria-label="Accès au Référentiel général d'amélioration de l'accessibilité"
                title="RGAA v3"
                isExternal
              >RGAA v3</Link>
              . La déclaration de conformité sera publiée ultérieurement.
            </Text>

            <Text as="h2" mb="2" mt="5" variant="homeEditorialH2">
              Nos engagements
            </Text>
            <Text as="p" mb="3">
              Audit de mise en conformité (en cours) pour nous aider à détecter les potentiels oublis d&apos;accessibilité.
              <br />
              Déclaration d&apos;accessibilité (en cours) pour expliquer en toute transparence notre démarche.
              <br />
              Mise à jour de cette page pour vous tenir informés de notre progression.
            </Text>

            <Text as="p" mb="3">
              Nos équipes ont ainsi travaillé sur les contrastes de couleur, la présentation et la structure de l&apos;information ou la clarté des formulaires.
            </Text>
            <Text as="p" mb="3">
              Des améliorations vont être apportées régulièrement.
            </Text>


            <Text as="h2" mb="2" mt="5" variant="homeEditorialH2">
              Améliorations et contact
            </Text>
            <Text as="p" mb="3">
              L&apos;équipe de La bonne alternance reste à votre écoute et entière disposition, si vous souhaitez nous signaler le moindre défaut de conception.
            </Text>

            <Text as="p" mb="3">
              Vous pouvez nous aider à améliorer l&apos;accessibilité du site en nous signalant les problèmes éventuels que vous rencontrez :{" "}
              <Link variant="editorialContentLink"
                href="mailto:labonnealternance@apprentissage.beta.gouv.fr?subject=CGU%20-%20Améliorer%20accessibilité"
                aria-label="Envoi d'un email à labonnealternance@apprentissage.beta.gouv.fr"
                title="Contactez-nous"
                isExternal
              >Contactez-nous</Link>
              .
            </Text>

            <Text as="p" mb="3">
              Vous pouvez également soumettre vos demandes de modification sur la plate-forme{" "}
              <Link variant="editorialContentLink"
                    href="https://github.com/mission-apprentissage/labonnealternance"
                    aria-label="Accès à Github"
                    title="Github"
                    isExternal >
                Github
              </Link>.
            </Text>

            <Text as="p" mb="3">
              Si vous rencontrez un défaut d’accessibilité vous empêchant d’accéder à un contenu ou une fonctionnalité du site, merci de nous en faire part.
              <br />
              Si vous n’obtenez pas de réponse rapide de notre part, vous êtes en droit de faire parvenir vos doléances ou une demande de saisine au Défenseur des droits.
            </Text>

            <Text as="h2" mb="2" mt="5" variant="homeEditorialH2">
              En savoir plus
            </Text>
            <Text as="p" mb="3">
              Pour en savoir plus sur la politique d’accessibilité numérique de l’État :<br />
              <Link variant="editorialContentLink"
                href="http://references.modernisation.gouv.fr/accessibilite-numerique"
                aria-label="Accès à la politique d’accessibilité numérique de l’État"
                title="http://references.modernisation.gouv.fr/accessibilite-numerique"
                isExternal
              >http://references.modernisation.gouv.fr/accessibilite-numerique</Link>
            </Text>

            <Text as="h2" mb="2" mt="5" variant="homeEditorialH2">
              Sécurité
            </Text>
            <Text as="p" mb="3">
              Le site est protégé par un certificat électronique, matérialisé pour la grande majorité des navigateurs par un cadenas. Cette protection participe à la confidentialité
              des échanges.
              <br />
              En aucun cas les services associés à au site ne seront à l’origine d’envoi de courriels pour demander la saisie d’informations personnelles.
            </Text>
          </Box>
        </GridItem>
      </Grid>
    </Container>

    <Footer />
  </Box>
)

export default MentionsLegales
