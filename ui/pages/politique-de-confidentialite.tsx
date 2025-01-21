import { ExternalLinkIcon } from "@chakra-ui/icons"
import { Box, Checkbox, Container, Divider, Link, SimpleGrid, Text } from "@chakra-ui/react"
import dynamic from "next/dynamic"
import { NextSeo } from "next-seo"
import React, { useEffect, useState } from "react"

import {
  CONSENT_COOKIE_NAME,
  CONSENT_REMOVED_COOKIE_NAME,
  forgetOptUserOut,
  getCookie,
  MTM_CONSENT_COOKIE_DURATION,
  optUserOut,
  removeCookie,
  setCookie,
} from "@/tracking/trackingCookieUtils"

import Breadcrumb from "../components/breadcrumb"
import Footer from "../components/footer"
import Navigation from "../components/navigation"
import ScrollToTop from "../components/ScrollToTop"
import { publicConfig } from "../config.public"
import { fetchNotionPage } from "../services/fetchNotionPage"

const NotionRenderer = dynamic(() => import("react-notion-x").then((mod) => mod.NotionRenderer), { ssr: false })

export async function getStaticProps() {
  const recordMap = await fetchNotionPage("2d7d9cda6d9a4059baa84eacff592139")
  return {
    props: {
      recordMap,
    },
  }
}

const PolitiqueDeConfidentialite = ({ recordMap }) => {
  const [hasConsent, setHasConsent] = useState(true)

  useEffect(() => {
    const removedCookie = getCookie(CONSENT_REMOVED_COOKIE_NAME)
    if (removedCookie) {
      setHasConsent(false)
    }
  }, [])

  const changeMatomoOptout = ({ checked }) => {
    if (checked) {
      removeCookie(CONSENT_REMOVED_COOKIE_NAME)
      setCookie(CONSENT_COOKIE_NAME, "" + new Date().getTime(), MTM_CONSENT_COOKIE_DURATION)
      forgetOptUserOut()
    } else {
      removeCookie(CONSENT_COOKIE_NAME)
      setCookie(CONSENT_REMOVED_COOKIE_NAME, "" + new Date().getTime(), MTM_CONSENT_COOKIE_DURATION)
      optUserOut()
    }
    setHasConsent(checked)
  }

  return (
    <Box>
      <NextSeo
        title="Politique de confidentialité | La bonne alternance | Trouvez votre alternance"
        description="Politique de confidentialité, traitement des données à caractère personnel sur le site de La bonne alternance."
      />
      <ScrollToTop />
      <Navigation />
      <Breadcrumb forPage="politique-de-confidentialite" label="Politique de confidentialité" />
      <Container p={12} my={0} mb={[0, 12]} variant="pageContainer">
        <SimpleGrid columns={[1, 1, 1, 2]}>
          <Box>
            <Box as="h1">
              <Text as="span" display="block" mb={1} variant="editorialContentH1" color="#2a2a2a">
                Politique
              </Text>
              <Text as="span" display="block" mb={1} variant="editorialContentH1">
                de confidentialité
              </Text>
            </Box>
            <Divider variant="pageTitleDivider" my={12} />
          </Box>
          <Box>
            <NotionRenderer recordMap={recordMap} fullPage={false} darkMode={false} disableHeader={true} rootDomain={publicConfig.baseUrl} className="disable-chakra" />
            <Box>
              La bonne alternance utilise la solution de mesure d'audience{" "}
              <Link href="https://matomo.org/" isExternal variant="basicUnderlinedBlue">
                Matomo <ExternalLinkIcon mb="3px" ml="2px" />
              </Link>{" "}
              en l'ayant configuré en mode « exempté », conformément aux{" "}
              <Link href="https://www.cnil.fr/fr/solutions-pour-la-mesure-daudience" isExternal variant="basicUnderlinedBlue">
                recommandations de la CNIL
                <ExternalLinkIcon mb="3px" ml="2px" />
              </Link>
              . Elle ne nécessite donc pas le consentement des personnes concernées. Vous pouvez malgré tout vous opposer au suivi de votre navigation, en décochant la case
              ci-dessous.
              <Checkbox
                mt={3}
                onChange={(event) => {
                  changeMatomoOptout({
                    checked: event.target.checked,
                  })
                }}
                isChecked={hasConsent}
              >
                <Text as="strong">Vous êtes suivi(e), de façon anonyme. Décochez cette case pour vous exclure du suivi.</Text>
              </Checkbox>
              {!hasConsent && (
                <Text mt={3}>
                  Note : si vous nettoyez vos cookies et supprimez le cookie d'exclusion, ou bien si vous changez d'ordinateur et/ou de navigateur, il vous faudra de nouveau
                  effectuer la procédure d'exclusion.
                </Text>
              )}
            </Box>
          </Box>
        </SimpleGrid>
      </Container>
      <Footer />
    </Box>
  )
}

export default PolitiqueDeConfidentialite
