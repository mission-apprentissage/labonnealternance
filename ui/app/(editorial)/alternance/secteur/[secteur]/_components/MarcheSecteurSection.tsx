import { fr } from "@codegouvfr/react-dsfr"
import { Box, Typography } from "@mui/material"
import { seoH2Sx, seoHrSx, seoSectionSx } from "@/app/(editorial)/alternance/_components/hub-styles"
import type { ISeoSecteurJson } from "@/app/(editorial)/alternance/secteur/[secteur]/_components/secteur.types"
import { BarChartHorizontal } from "@/app/(editorial)/barometre/_components/BarChartHorizontal"
import { DsfrLink } from "@/components/dsfr/DsfrLink"

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
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "minmax(0, 3fr) minmax(0, 2fr)" }, gap: { xs: 0, md: fr.spacing("10v") }, alignItems: "start" }}>
          {marche.comparaison ? (
            <BarChartHorizontal
              title={marche.comparaison.titre}
              items={marche.comparaison.barres.map((barre) => ({ label: barre.libelle, value: barre.valeur, displayValue: barre.affichage }))}
              source={`${marche.comparaison.source_libelle} (${marche.comparaison.annee})`}
            />
          ) : (
            <Box />
          )}
          <Box sx={{ display: "flex", flexDirection: "column", gap: fr.spacing("4v"), my: { xs: 0, md: fr.spacing("10v") } }}>
            {marche.faits.map((fait) => (
              <Box key={fait.texte} sx={{ backgroundColor: fr.colors.decisions.background.alt.purpleGlycine.default, borderRadius: "4px", p: fr.spacing("5v") }}>
                <Typography sx={{ fontSize: "2rem", fontWeight: 700, lineHeight: 1.1, color: fr.colors.decisions.text.title.grey.default }}>{fait.valeur}</Typography>
                <Typography sx={{ mt: fr.spacing("1v") }}>{fait.texte}</Typography>
                <Typography sx={{ mt: fr.spacing("2v"), fontSize: "0.75rem", color: fr.colors.decisions.text.mention.grey.default }}>
                  {fait.source_url ? <DsfrLink href={fait.source_url}>{fait.source_libelle}</DsfrLink> : fait.source_libelle}, {fait.annee}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      )}

      {marche?.interpretation && <Typography sx={{ mt: fr.spacing("2v") }}>{marche.interpretation}</Typography>}
    </Box>
  )
}
