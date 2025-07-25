"use client"
import { fr } from "@codegouvfr/react-dsfr"
import { Box, Checkbox, FormControlLabel, Grid2 as Grid, Typography } from "@mui/material"
import dynamic from "next/dynamic"
import Image from "next/image"
import Link from "next/link"
import { useEffect, useState } from "react"

import { Breadcrumb } from "@/app/_components/Breadcrumb"
import DefaultContainer from "@/app/_components/Layout/DefaultContainer"
import { DsfrLink } from "@/components/dsfr/DsfrLink"
import { publicConfig } from "@/config.public"
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
import { PAGES } from "@/utils/routes.utils"

const NotionRenderer = dynamic(() => import("react-notion-x").then((mod) => mod.NotionRenderer))

export default function PolitiqueDeConfidentialiteRendererClient({ politiqueDeConfidentialite }: { politiqueDeConfidentialite: any }) {
  const [hasConsent, setHasConsent] = useState(true)

  useEffect(() => {
    const removedCookie = getCookie(CONSENT_REMOVED_COOKIE_NAME)
    if (removedCookie) {
      setHasConsent(false)
    }
  }, [])

  const changeMatomoOptout = ({ checked }: { checked: boolean }) => {
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
      <Breadcrumb pages={[PAGES.static.politiqueConfidentialite]} />
      <DefaultContainer>
        <Box sx={{ p: fr.spacing("5w"), marginBottom: fr.spacing("5w"), borderRadius: "10px", backgroundColor: fr.colors.decisions.background.default.grey.hover }}>
          <Grid container spacing={0}>
            <Grid size={{ xs: 12, md: 5 }} sx={{ px: 4 }}>
              <Typography component="h1" variant="h1" sx={{ mb: 2 }}>
                Politique
                <Typography component="h1" variant="h1" sx={{ display: "block", color: fr.colors.decisions.text.default.info.default }}>
                  de confidentialité
                </Typography>
              </Typography>
              <Box
                component="hr"
                sx={{ maxWidth: "93px", border: "none", borderBottom: "none", borderTop: `4px solid ${fr.colors.decisions.text.default.info.default}`, opacity: 1 }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 7 }} sx={{ px: 4 }}>
              <Box>
                <NotionRenderer
                  recordMap={politiqueDeConfidentialite}
                  fullPage={false}
                  darkMode={false}
                  disableHeader={true}
                  rootDomain={publicConfig.baseUrl}
                  className="notion-body"
                  components={{
                    nextImage: Image,
                    nextLink: Link,
                  }}
                />
                <Box sx={{ mt: 3 }}>
                  <Typography sx={{ mb: 2 }}>
                    La bonne alternance utilise la solution de mesure d'audience <DsfrLink href="https://matomo.org/">Matomo</DsfrLink> en l'ayant configuré en mode « exempté »,
                    conformément aux <DsfrLink href="https://www.cnil.fr/fr/solutions-pour-la-mesure-daudience">recommandations de la CNIL</DsfrLink>. Elle ne nécessite donc pas le
                    consentement des personnes concernées. Vous pouvez malgré tout vous opposer au suivi de votre navigation, en décochant la case ci-dessous.
                  </Typography>
                  <FormControlLabel
                    control={
                      <Checkbox
                        onChange={(event) => {
                          changeMatomoOptout({
                            checked: event.target.checked,
                          })
                        }}
                        checked={hasConsent}
                      />
                    }
                    label={<Typography component="strong">Vous êtes suivi(e), de façon anonyme. Décochez cette case pour vous exclure du suivi.</Typography>}
                    sx={{ mt: 2 }}
                  />
                  {!hasConsent && (
                    <Typography sx={{ mt: 2 }}>
                      Note : si vous nettoyez vos cookies et supprimez le cookie d'exclusion, ou bien si vous changez d'ordinateur et/ou de navigateur, il vous faudra de nouveau
                      effectuer la procédure d'exclusion.
                    </Typography>
                  )}
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </DefaultContainer>
    </Box>
  )
}
