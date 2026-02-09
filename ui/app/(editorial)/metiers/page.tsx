import path from "path"

import { fr } from "@codegouvfr/react-dsfr"
import { Box, Stack, Typography } from "@mui/material"
import type { Metadata } from "next"
import Link from "next/link"

import { Breadcrumb } from "@/app/_components/Breadcrumb"
import DefaultContainer from "@/app/_components/Layout/DefaultContainer"
import { getStaticMetiers } from "@/utils/getStaticData"
import { PAGES } from "@/utils/routes.utils"

export const metadata: Metadata = {
  title: PAGES.static.metiers.getMetadata().title,
  description: PAGES.static.metiers.getMetadata().description,
}

export default async function Metiers() {
  const txtDirectory = path.join(process.cwd(), "config")
  const jobs = getStaticMetiers(txtDirectory)

  return (
    <Box>
      <Breadcrumb pages={[PAGES.static.metiers]} />
      <DefaultContainer>
        <Box sx={{ p: fr.spacing("10v"), marginBottom: fr.spacing("10v"), borderRadius: "10px", backgroundColor: fr.colors.decisions.background.default.grey.hover }}>
          <Typography id="editorial-content-container" component="h1" variant="h1" sx={{ mb: fr.spacing("4v") }}>
            Tous les emplois
            <Typography component="h1" variant="h1" sx={{ display: "block", color: fr.colors.decisions.text.default.info.default }}>
              et formations en alternance
            </Typography>
          </Typography>
          <Box
            component="hr"
            sx={{
              maxWidth: "93px",
              border: "none",
              borderBottom: "none",
              borderTop: `4px solid ${fr.colors.decisions.text.default.info.default}`,
              opacity: 1,
              my: fr.spacing("6v"),
            }}
          />
          <Typography component="p" sx={{ mb: fr.spacing("4v") }}>
            Vous voulez travailler en alternance ? Vous voulez obtenir un diplôme en alternance ? Toutes les informations pour trouver une alternance rapidement sont sur La bonne
            alternance :
          </Typography>
          <Stack
            spacing={1}
            sx={{
              alignItems: "flex-start",
              mt: fr.spacing("4v"),
            }}
          >
            <Typography>Offres d&apos;emploi en contrat d&apos;apprentissage ou en contrat de professionnalisation</Typography>
            <Typography>Liste d'entreprises qui recrutent en alternance</Typography>
            <Typography>Formations en apprentissage en CAP, Bac pro, Mention complémentaire, BTS, BUT, DEUST, Licence, Master</Typography>

            {jobs.map((job, index) => {
              return (
                <Typography key={index} sx={{ mt: 0, mb: { xs: 2, md: 0 } }}>
                  <Typography component="span">Emploi en alternance et formation en alternance en </Typography>
                  <Link className={fr.cx("fr-link", "fr-text--bold")} href={`/metiers/${job.slug}`} aria-label={`Lancement d'une recherche sur le métier ${job.name}`}>
                    {job.name}
                  </Link>
                </Typography>
              )
            })}
          </Stack>
        </Box>
      </DefaultContainer>
    </Box>
  )
}
