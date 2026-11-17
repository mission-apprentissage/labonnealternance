import { fr } from "@codegouvfr/react-dsfr"
import { Box, Typography } from "@mui/material"
import Image from "next/image"
import CarteOffre from "@/app/(editorial)/alternance/_components/CarteOffre"
import { formatNumber, seoH2Sx, seoHrSx, seoSectionSx } from "@/app/(editorial)/alternance/_components/hub-styles"
import { JobsCtaTracked } from "@/app/(editorial)/alternance/_components/JobsCtaTracked"
import type { ISeoSecteurJson } from "@/app/(editorial)/alternance/secteur/[secteur]/_components/secteur.types"
import { TagCandidatureSpontanee } from "@/components/ItemDetail/TagCandidatureSpontanee"
import { TagOffreEmploi } from "@/components/ItemDetail/TagOffreEmploi"

type Props = Pick<ISeoSecteurJson, "secteur" | "job_count" | "algo_company_count" | "cards"> & {
  offresSearchUrl: string
  candidaturesSearchUrl: string
  utmParams: string
}

const panelSx = {
  backgroundColor: fr.colors.decisions.background.default.grey.hover,
  flex: 1,
  boxShadow: "0 2px 6px 0 rgba(0, 0, 18, 0.16)",
  padding: fr.spacing("4v"),
  display: "flex",
  flexDirection: "column",
} as const

// Deux blocs, chacun avec son bouton : offres d'emploi d'un côté, candidatures spontanées de l'autre (même rendu que la page ville).
export function OffresEtCandidaturesSection({ secteur, job_count, algo_company_count, cards, offresSearchUrl, candidaturesSearchUrl, utmParams }: Props) {
  if (!job_count && !algo_company_count) return null

  return (
    <Box sx={seoSectionSx}>
      <Typography component="h2" variant="h2" sx={seoH2Sx}>
        Offres et entreprises qui recrutent en alternance en <span style={{ color: fr.colors.decisions.text.default.info.default }}>{secteur}</span>
      </Typography>
      <Box aria-hidden="true" component="hr" sx={seoHrSx} />

      <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, gap: fr.spacing("4v") }}>
        {job_count ? (
          <Box sx={panelSx}>
            <TagOffreEmploi />
            <Box sx={{ display: "flex", flex: 1 }}>
              <Box sx={{ flex: 2 }}>
                <Typography sx={{ fontWeight: "bold", lineHeight: "2.5rem", fontSize: "2rem", color: fr.colors.decisions.text.default.info.default, mt: fr.spacing("4v") }}>
                  {formatNumber(job_count ?? 0)}
                </Typography>
                <Typography sx={{ fontWeight: "bold", color: fr.colors.decisions.text.default.info.default }}>
                  offres d'emploi{" "}
                  <Typography component="span" sx={{ fontWeight: "bold", color: "#161616" }}>
                    auprès desquelles postuler
                  </Typography>
                </Typography>
              </Box>
              <Box sx={{ flex: 1, textAlign: "right", pt: fr.spacing("4v") }}>
                <Image src="/images/seo/offre-emploi.svg" alt="" width={80} height={80} />
              </Box>
            </Box>
            <Box sx={{ mt: fr.spacing("4v") }}>
              <JobsCtaTracked href={offresSearchUrl} searchOrigin="page_secteur" searchJobName={secteur} size="medium">
                Voir les offres en {secteur}
              </JobsCtaTracked>
            </Box>
          </Box>
        ) : null}

        {algo_company_count ? (
          <Box sx={panelSx}>
            <TagCandidatureSpontanee />
            <Box sx={{ display: "flex", flex: 1 }}>
              <Box sx={{ flex: 2 }}>
                <Typography sx={{ fontWeight: "bold", lineHeight: "2.5rem", fontSize: "2rem", color: "#716043", mt: fr.spacing("4v") }}>
                  {formatNumber(algo_company_count ?? 0)}
                </Typography>
                <Typography sx={{ fontWeight: "bold", color: "#716043" }}>
                  entreprises{" "}
                  <Typography component="span" sx={{ fontWeight: "bold", color: "#161616" }}>
                    qui recrutent des alternants, même sans offre publiée : envoyez-leur une candidature spontanée
                  </Typography>
                </Typography>
              </Box>
              <Box sx={{ flex: 1, textAlign: "right", pt: fr.spacing("4v") }}>
                <Image src="/images/seo/candidature-spontanee.svg" alt="" width={80} height={80} />
              </Box>
            </Box>
            <Box sx={{ mt: fr.spacing("4v") }}>
              <JobsCtaTracked href={candidaturesSearchUrl} searchOrigin="page_secteur" searchJobName={secteur} size="medium" priority="secondary">
                Voir les entreprises à contacter
              </JobsCtaTracked>
            </Box>
          </Box>
        ) : null}
      </Box>

      {cards && cards.length > 0 && (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "repeat(1, minmax(0, 1fr))", lg: "repeat(3, minmax(0, 1fr))" },
            gap: fr.spacing("4v"),
            mt: fr.spacing("8v"),
          }}
        >
          {cards.map((card) => (
            <CarteOffre key={card._id.toString()} card={card} utmParams={utmParams} />
          ))}
        </Box>
      )}
    </Box>
  )
}
