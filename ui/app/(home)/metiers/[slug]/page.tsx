import path from "path"

import { fr } from "@codegouvfr/react-dsfr"
import { Box, Stack, Typography } from "@mui/material"
import { Metadata } from "next"
import Link from "next/link"

import { Breadcrumb } from "@/app/_components/Breadcrumb"
import DefaultContainer from "@/app/_components/Layout/DefaultContainer"
import { buildLinkForTownAndJob } from "@/utils/buildLinkForTownAndJob"
import { getStaticMetiers, getStaticVilles, IStaticMetiers } from "@/utils/getStaticData"
import { PAGES } from "@/utils/routes.utils"

const getTowns = () => {
  const txtDirectory = path.join(process.cwd(), "config")
  const towns = getStaticVilles(txtDirectory)
  return towns
}
const getMetiers = () => {
  const txtDirectory = path.join(process.cwd(), "config")
  const jobs = getStaticMetiers(txtDirectory)
  return jobs
}

const getMetierBySlug = (jobs: IStaticMetiers[], slug: IStaticMetiers["slug"]) => {
  const relatedTown = jobs.find((town) => town.slug === slug)
  return relatedTown
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const _params = await params
  const metier = getMetierBySlug(getMetiers(), _params.slug)
  return {
    title: PAGES.dynamic.metierJobById(metier.name).getMetadata().title,
    description: PAGES.dynamic.metierJobById(metier.name).getMetadata().description,
  }
}

export default async function MetiersByJobId({ params }: { params: IStaticMetiers }) {
  const _params = params
  const towns = getTowns()
  const metiers = getMetiers()
  const relatedMetier = getMetierBySlug(metiers, _params.slug)
  return (
    <Box>
      <Breadcrumb pages={[PAGES.static.metiers, PAGES.dynamic.metierJobById(relatedMetier.name)]} />
      <DefaultContainer>
        <Box sx={{ p: fr.spacing("5w"), marginBottom: fr.spacing("5w"), borderRadius: "10px", backgroundColor: fr.colors.decisions.background.default.grey.hover }}>
          <Typography component="h1" variant="h1" sx={{ mb: 2 }}>
            Tous les emplois et formations en alternance en
            <Typography component="h1" variant="h1" sx={{ color: fr.colors.decisions.text.default.info.default, display: "block" }}>
              {relatedMetier.name}
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
              my: fr.spacing("3w"),
            }}
          />

          <Typography component="p" sx={{ mb: 2 }}>
            Vous êtes à seulement 2 clics d&apos;obtenir toutes les informations pour trouver une alternance rapidement sur La bonne alternance :
          </Typography>
          <Stack spacing={1} alignItems="flex-start">
            <Typography>
              Offres d&apos;emploi en contrat d&apos;apprentissage ou en contrat de professionnalisation en <i>{relatedMetier.name}</i>
            </Typography>
            <Typography>
              Liste d'entreprises qui recrutent en alternance en <i>{relatedMetier.name}</i>
            </Typography>
            <Typography>
              Formations en apprentissage en CAP, Bac pro, Mention complémentaire, BTS, BUT, DEUST, Licence, Master en <i>{relatedMetier.name}</i>
            </Typography>

            <Typography sx={{ mt: 0, mb: { xs: 2, md: 0 } }}>
              <Typography component="span">Emploi en alternance et formation en alternance en </Typography>

              <Link
                className={fr.cx("fr-link", "fr-text--bold")}
                href={buildLinkForTownAndJob({ name: "France" }, relatedMetier)}
                title={`Voir les emplois en alternance et formation en alternance en ${relatedMetier.name} sur l'ensemble du territoire`}
              >
                {relatedMetier.name} sur l'ensemble du territoire
              </Link>
            </Typography>

            {towns.map((currentTown, index) => {
              return (
                <Typography key={index} sx={{ mt: 0, mb: { xs: 2, md: 0 } }}>
                  <Typography component="span">Emploi en alternance et formation en alternance en </Typography>
                  <Link
                    className={fr.cx("fr-link", "fr-text--bold")}
                    href={buildLinkForTownAndJob(currentTown, relatedMetier)}
                    title={`Voir les emplois en alternance et formation en alternance en ${relatedMetier.name} à ${currentTown.name}`}
                  >
                    {relatedMetier.name} à {currentTown.name}
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
