import { fr } from "@codegouvfr/react-dsfr"
import { Box, Typography } from "@mui/material"
import { seoH2Sx, seoHrSx, seoSectionSx } from "@/app/(editorial)/alternance/_components/hub-styles"
import type { ISeoSecteurJson } from "@/app/(editorial)/alternance/secteur/[secteur]/_components/secteur.types"
import { DsfrLink } from "@/components/dsfr/DsfrLink"

type Props = Pick<ISeoSecteurJson, "secteur" | "marche" | "job_count" | "company_count">

const formatNumber = (value: number) => new Intl.NumberFormat("fr-FR").format(value)

export function MarcheSecteurSection({ secteur, marche, job_count, company_count }: Props) {
  if (!marche && !job_count) return null

  return (
    <Box sx={seoSectionSx}>
      <Typography component="h2" variant="h2" sx={seoH2Sx}>
        Alternance en <span style={{ color: fr.colors.decisions.text.default.info.default }}>{secteur}</span> : un secteur qui recrute ?
      </Typography>
      <Box aria-hidden="true" component="hr" sx={seoHrSx} />
      {marche && (
        <Box component="ul" sx={{ mb: fr.spacing("4v") }}>
          <li>
            <Typography component="span" sx={{ fontWeight: 700 }}>
              {formatNumber(marche.projets_recrutement)} projets de recrutement
            </Typography>{" "}
            en {marche.annee}, dont {marche.part_difficiles} % jugés difficiles par les employeurs.
          </li>
        </Box>
      )}
      {job_count ? (
        <Typography sx={{ fontSize: "1.125rem" }}>
          Aujourd'hui sur La bonne alternance :{" "}
          <Typography component="span" sx={{ fontWeight: 700, fontSize: "1.125rem" }}>
            {formatNumber(job_count)} offres en alternance
          </Typography>{" "}
          publiées par {formatNumber(company_count ?? 0)} entreprises.
        </Typography>
      ) : null}
      {marche && (
        <>
          <Typography sx={{ mt: fr.spacing("3v") }}>{marche.interpretation}</Typography>
          <Typography sx={{ mt: fr.spacing("2v"), fontSize: "0.75rem", color: fr.colors.decisions.text.mention.grey.default }}>
            Source : <DsfrLink href={marche.source_url}>{marche.source_libelle}</DsfrLink> ({marche.annee})
          </Typography>
        </>
      )}
    </Box>
  )
}
