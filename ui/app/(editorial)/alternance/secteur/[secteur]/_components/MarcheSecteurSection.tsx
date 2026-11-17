import { fr } from "@codegouvfr/react-dsfr"
import { Box, Typography } from "@mui/material"
import { seoH2Sx, seoHrSx, seoSectionSx } from "@/app/(editorial)/alternance/_components/hub-styles"
import type { ISeoSecteurJson } from "@/app/(editorial)/alternance/secteur/[secteur]/_components/secteur.types"
import { DsfrLink } from "@/components/dsfr/DsfrLink"

type Props = Pick<ISeoSecteurJson, "secteur" | "marche" | "job_count" | "total_job_count" | "company_count">

const formatNumber = (value: number) => new Intl.NumberFormat("fr-FR").format(value)
const strongSx = { fontWeight: 700, color: fr.colors.decisions.text.default.info.default }

export function MarcheSecteurSection({ secteur, marche, job_count, total_job_count, company_count }: Props) {
  if (!marche && !job_count) return null

  const part = job_count && total_job_count ? Math.round((job_count / total_job_count) * 100) : null
  const sources = [...(marche?.comparaison ? [marche.comparaison] : []), ...(marche?.faits ?? [])].filter(
    (source, idx, all) => all.findIndex((s) => s.source_url === source.source_url) === idx
  )

  return (
    <Box sx={seoSectionSx}>
      <Typography component="h2" variant="h2" sx={seoH2Sx}>
        Alternance en <span style={{ color: fr.colors.decisions.text.default.info.default }}>{secteur}</span> : un secteur qui recrute ?
      </Typography>
      <Box aria-hidden="true" component="hr" sx={seoHrSx} />

      {job_count ? (
        <Typography sx={{ mb: fr.spacing("3v") }}>
          Aujourd'hui sur La bonne alternance, <strong style={strongSx}>{formatNumber(job_count)} offres en alternance</strong> sont publiées par {formatNumber(company_count ?? 0)}{" "}
          entreprises{part ? `, soit ${part} % de l'ensemble des offres d'alternance du site` : ""}.
        </Typography>
      ) : null}

      {marche && (
        <>
          {marche.comparaison && marche.comparaison.barres.length > 0 && (
            <>
              <Typography sx={{ mb: fr.spacing("1v") }}>
                {marche.comparaison.titre} ({marche.comparaison.annee}) :
              </Typography>
              <Box component="ul" sx={{ mb: fr.spacing("3v") }}>
                {marche.comparaison.barres.map((barre) => (
                  <li key={barre.libelle}>
                    <Typography component="span">
                      {barre.libelle} : <strong style={strongSx}>{barre.affichage}</strong>
                    </Typography>
                  </li>
                ))}
              </Box>
            </>
          )}
          {marche.faits.length > 0 && (
            <Box component="ul" sx={{ mb: fr.spacing("3v") }}>
              {marche.faits.map((fait) => (
                <li key={fait.texte}>
                  <Typography component="span">
                    <strong style={strongSx}>{fait.valeur}</strong> {fait.texte} ({fait.annee}).
                  </Typography>
                </li>
              ))}
            </Box>
          )}
          <Typography sx={{ mb: fr.spacing("3v") }}>{marche.interpretation}</Typography>
          {sources.length > 0 && (
            <Typography sx={{ fontSize: "0.75rem", color: fr.colors.decisions.text.mention.grey.default }}>
              Sources :{" "}
              {sources.map((source, idx) => (
                <span key={source.source_url}>
                  {idx > 0 && " · "}
                  <DsfrLink href={source.source_url} size="sm">
                    {source.source_libelle}
                  </DsfrLink>
                </span>
              ))}
            </Typography>
          )}
        </>
      )}
    </Box>
  )
}
