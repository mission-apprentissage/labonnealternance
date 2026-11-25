import { fr } from "@codegouvfr/react-dsfr"
import CallOut from "@codegouvfr/react-dsfr/CallOut"
import { Summary } from "@codegouvfr/react-dsfr/Summary"
import { Box, Typography } from "@mui/material"
import type { Metadata } from "next"
import { Breadcrumb } from "@/app/_components/Breadcrumb"
import { OPCO_GUIDE_SECTIONS } from "@/app/(espace-pro)/espace-pro/(connected)/_components/moderation/opco-guide.utils"
import { DsfrLink } from "@/components/dsfr/DsfrLink"
import { MODERATION_PAGES } from "@/utils/moderation-pages.utils"
import { PAGES } from "@/utils/routes.utils"
import { OpcoGuideCtaButton, OpcoGuideDisplayedTracking } from "./OpcoGuideTracking"

const CONTACT_EMAIL = "contact@labonnealternance.apprentissage.beta.gouv.fr"

export const metadata: Metadata = {
  title: `${MODERATION_PAGES.opcoGuide.title} - La bonne alternance`,
  robots: { index: false, follow: false },
}

// Le texte du guide est à usage restreint et ce dépôt est public : il n'est pas versionné ici (#6006).
export default function GuideModerationOpcoPage() {
  return (
    <Box sx={{ px: { xs: 2, md: 0 } }}>
      <OpcoGuideDisplayedTracking />
      <Breadcrumb pages={[PAGES.static.backOpcoHome, MODERATION_PAGES.opcoGuide]} />
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 3fr" }, gap: fr.spacing("8v"), alignItems: "start" }}>
        <Box sx={{ position: { md: "sticky" }, top: { md: fr.spacing("4v") } }}>
          <Summary links={OPCO_GUIDE_SECTIONS.map(({ id, title }) => ({ text: title, linkProps: { href: `#${id}` } }))} />
        </Box>
        <Box>
          <Typography variant="h2" component="h1" gutterBottom>
            Guide de modération des comptes et des offres
          </Typography>
          <p className={fr.cx("fr-text--lead", "fr-mb-6v")}>Comment vérifier les comptes de vos entreprises et lire les offres signalées par l’analyse automatique.</p>
          <CallOut iconId="fr-icon-lock-line" title="Document à usage restreint" titleAs="p" colorVariant="orange-terre-battue" className={fr.cx("fr-mb-8v")}>
            Ce guide est réservé aux personnes habilitées à l’espace OPCO. Merci de ne pas le diffuser hors de votre OPCO.
          </CallOut>
          {OPCO_GUIDE_SECTIONS.map(({ id, title }, index) => (
            <Box component="section" key={id} id={id} aria-labelledby={`${id}-titre`} sx={{ mb: fr.spacing("10v"), scrollMarginTop: fr.spacing("4v") }}>
              <Typography variant="h3" component="h2" id={`${id}-titre`} gutterBottom>
                {index + 1}. {title}
              </Typography>
              <Typography>Contenu en cours d’intégration.</Typography>
              {id === "guide-faq" && (
                <Typography sx={{ mt: fr.spacing("4v") }}>
                  Question sur une offre ou erreur d’analyse : <DsfrLink href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</DsfrLink>
                </Typography>
              )}
            </Box>
          ))}
          <OpcoGuideCtaButton />
        </Box>
      </Box>
    </Box>
  )
}
