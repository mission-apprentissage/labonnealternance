import { fr } from "@codegouvfr/react-dsfr"
import { Box, Typography } from "@mui/material"
import { seoH2Sx, seoHrSx, seoSectionSx } from "@/app/(editorial)/alternance/_components/hub-styles"
import { ComparaisonIndicateurs } from "@/app/(editorial)/alternance/secteur/[secteur]/_components/ComparaisonIndicateurs"
import type { ISeoSecteurJson } from "@/app/(editorial)/alternance/secteur/[secteur]/_components/secteur.types"

type Props = Pick<ISeoSecteurJson, "secteur" | "marche" | "job_count" | "total_job_count" | "company_count">

const formatNumber = (value: number) => new Intl.NumberFormat("fr-FR").format(value)

export function MarcheSecteurSection({ secteur, marche, job_count, total_job_count, company_count }: Props) {
  if (!marche && !job_count) return null

  const part = job_count && total_job_count ? Math.round((job_count / total_job_count) * 100) : null

  return (
    <Box sx={seoSectionSx}>
      <Typography component="h2" variant="h2" sx={seoH2Sx}>
        Alternance en <span style={{ color: fr.colors.decisions.text.default.info.default }}>{secteur}</span> : un secteur qui recrute ?
      </Typography>
      <Box aria-hidden="true" component="hr" sx={seoHrSx} />
      {job_count ? (
        <Typography sx={{ fontSize: "1.125rem" }}>
          Aujourd'hui sur La bonne alternance :{" "}
          <Typography component="span" sx={{ fontWeight: 700, fontSize: "1.125rem" }}>
            {formatNumber(job_count)} offres en alternance
          </Typography>{" "}
          publiées par {formatNumber(company_count ?? 0)} entreprises
          {part ? `, soit ${part} % de l'ensemble des offres d'alternance du site` : ""}.
        </Typography>
      ) : null}
      {marche && (
        <>
          {marche.indicateurs.length > 0 && <ComparaisonIndicateurs secteur={secteur} indicateurs={marche.indicateurs} />}
          <Typography sx={{ mt: fr.spacing("4v") }}>{marche.interpretation}</Typography>
        </>
      )}
    </Box>
  )
}
