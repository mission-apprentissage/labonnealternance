import { fr } from "@codegouvfr/react-dsfr"
import { Box, Typography } from "@mui/material"
import type { Metadata } from "next"
import { cacheLife } from "next/cache"
import { Suspense } from "react"
import type { INewsletterPublicJSON } from "shared/models/newsletter.model"

import { Breadcrumb } from "@/app/_components/Breadcrumb"
import DefaultContainer from "@/app/_components/Layout/DefaultContainer"
import { apiGet } from "@/utils/api.utils"
import { formatNewsletterDate } from "@/utils/newsletter.utils"
import { METADATA } from "@/utils/routes.metadata.utils"
import { PAGES } from "@/utils/routes.utils"

import { NewsletterCard } from "./NewsletterCard"

const LINKEDIN_SUBSCRIBE_URL = "https://www.linkedin.com/newsletters/la-lettre-de-l-alternance-7516167190597955584/"

export const metadata: Metadata = {
  title: METADATA.static.laLettreDeLAlternance().title,
  description: METADATA.static.laLettreDeLAlternance().description,
}

async function getNewsletters(): Promise<INewsletterPublicJSON[]> {
  // `apiGet` lit `headers()` : seul `"use cache: private"` l'autorise (cf. getVilleData)
  "use cache: private"
  cacheLife("minutes")
  const { newsletters } = await apiGet("/newsletters", {})
  return newsletters
}

/** Hors de la fonction mise en cache : une panne passagère ne reste pas affichée pendant la durée du cache. */
async function getNewslettersOrNull(): Promise<INewsletterPublicJSON[] | null> {
  try {
    return await getNewsletters()
  } catch {
    return null
  }
}

export default function LaLettreDeLAlternance() {
  return (
    <Box>
      <Breadcrumb pages={[PAGES.static.aPropos, PAGES.static.laLettreDeLAlternance]} />
      <DefaultContainer>
        <Box
          component="section"
          aria-labelledby="la-lettre-titre"
          sx={{
            p: { xs: fr.spacing("6v"), md: fr.spacing("10v") },
            mb: fr.spacing("10v"),
            borderRadius: "10px",
            backgroundColor: fr.colors.decisions.background.alt.blueFrance.default,
          }}
        >
          <Typography id="la-lettre-titre" component="h1" variant="h1" sx={{ mb: fr.spacing("4v"), color: fr.colors.decisions.text.title.blueFrance.default }}>
            La lettre de l'alternance
          </Typography>
          <Typography sx={{ mb: fr.spacing("2v"), maxWidth: "720px" }}>
            Chaque mois, l'équipe de La bonne alternance partage dans son infolettre les nouveautés du service, les chiffres clés et les bonnes pratiques pour réussir une entrée en
            alternance.
          </Typography>
          <Typography sx={{ mb: fr.spacing("6v"), maxWidth: "720px" }}>
            Les éditions se lisent sur LinkedIn, sans compte. Un compte LinkedIn est nécessaire pour s'abonner.
          </Typography>
          <a className={fr.cx("fr-btn", "fr-btn--icon-left", "fr-icon-linkedin-box-fill")} href={LINKEDIN_SUBSCRIBE_URL} target="_blank" rel="noopener noreferrer">
            S'abonner sur LinkedIn
            <span className="fr-sr-only"> - nouvelle fenêtre</span>
          </a>
        </Box>

        <Box component="section" aria-labelledby="la-lettre-editions" sx={{ mb: fr.spacing("16v") }}>
          <Typography id="la-lettre-editions" component="h2" variant="h2" sx={{ mb: fr.spacing("6v") }}>
            Les dernières éditions
          </Typography>
          <Suspense fallback={<Typography>Chargement des éditions…</Typography>}>
            <NewsletterEditions />
          </Suspense>
        </Box>
      </DefaultContainer>
    </Box>
  )
}

async function NewsletterEditions() {
  const newsletters = await getNewslettersOrNull()

  if (newsletters === null) {
    return <Typography>Les éditions ne peuvent pas être affichées pour le moment. Vous pouvez les retrouver sur LinkedIn.</Typography>
  }
  if (newsletters.length === 0) {
    return <Typography>Aucune édition n'est encore disponible.</Typography>
  }

  return (
    <Box
      component="ul"
      sx={{ listStyle: "none", p: 0, m: 0, display: "grid", gap: fr.spacing("6v"), gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" } }}
    >
      {newsletters.map((newsletter) => (
        <Box component="li" key={newsletter._id} sx={{ p: 0, display: "flex" }}>
          <NewsletterCard title={newsletter.title} date={formatNewsletterDate(newsletter.edition_date, "long")} href={newsletter.linkedin_url} />
        </Box>
      ))}
    </Box>
  )
}
