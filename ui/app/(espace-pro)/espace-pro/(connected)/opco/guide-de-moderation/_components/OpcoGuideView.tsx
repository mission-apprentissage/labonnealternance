import { fr } from "@codegouvfr/react-dsfr"
import CallOut from "@codegouvfr/react-dsfr/CallOut"
import { Summary } from "@codegouvfr/react-dsfr/Summary"
import { Box, Typography } from "@mui/material"
import { Breadcrumb } from "@/app/_components/Breadcrumb"
import { OPCO_GUIDE_SECTIONS } from "@/app/(espace-pro)/espace-pro/(connected)/_components/moderation/opco-guide.utils"
import { DsfrLink } from "@/components/dsfr/DsfrLink"
import { MODERATION_PAGES } from "@/utils/moderation-pages.utils"
import { PAGES } from "@/utils/routes.utils"
import type { OpcoGuide } from "../_lib/notion-guide"
import { OpcoGuideCtaButton, OpcoGuideDisplayedTracking } from "../OpcoGuideTracking"
import { NotionGuideBlocks, RichText } from "./NotionGuideBlocks"

const CONTACT_EMAIL = "contact@labonnealternance.apprentissage.beta.gouv.fr"

const sectionSx = { mb: fr.spacing("10v"), scrollMarginTop: fr.spacing("4v") }

/** Guide rendu depuis Notion, ou sections vides quand le contenu n'est pas disponible (cf. fetchOpcoGuide). */
export function OpcoGuideView({ guide }: { guide: OpcoGuide | null }) {
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
          {guide ? (
            <>
              <NotionGuideBlocks blocks={guide.intro} lead />
              {guide.sections.map(({ id, title, blocks }) => (
                <Box component="section" key={id} id={id} aria-labelledby={`${id}-titre`} sx={sectionSx}>
                  <Typography variant="h3" component="h2" id={`${id}-titre`} gutterBottom>
                    <RichText value={title} />
                  </Typography>
                  <NotionGuideBlocks blocks={blocks} />
                </Box>
              ))}
            </>
          ) : (
            <>
              <p className={fr.cx("fr-text--lead", "fr-mb-6v")}>Comment vérifier les comptes de vos entreprises et lire les offres signalées par l’analyse automatique.</p>
              <CallOut iconId="fr-icon-lock-line" title="Document à usage restreint" titleAs="p" colorVariant="orange-terre-battue" className={fr.cx("fr-mb-8v")}>
                Ce guide est réservé aux personnes habilitées à l’espace OPCO. Merci de ne pas le diffuser hors de votre OPCO.
              </CallOut>
              {OPCO_GUIDE_SECTIONS.map(({ id, title }, index) => (
                <Box component="section" key={id} id={id} aria-labelledby={`${id}-titre`} sx={sectionSx}>
                  <Typography variant="h3" component="h2" id={`${id}-titre`} gutterBottom>
                    {index + 1}. {title}
                  </Typography>
                  <Typography>Contenu momentanément indisponible.</Typography>
                  {id === "guide-faq" && (
                    <Typography sx={{ mt: fr.spacing("4v") }}>
                      Question sur une offre ou erreur d’analyse : <DsfrLink href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</DsfrLink>
                    </Typography>
                  )}
                </Box>
              ))}
            </>
          )}
          <p>Vous pouvez maintenant vérifier les comptes en attente. Chaque compte validé permet de publier des offres attendues par de nombreux candidats.</p>
          <OpcoGuideCtaButton />
        </Box>
      </Box>
    </Box>
  )
}
