import { fr } from "@codegouvfr/react-dsfr"
import Card from "@codegouvfr/react-dsfr/Card"
import { Box, Typography } from "@mui/material"
import { buildSearchUrl } from "@/app/(candidat)/(recherche)/recherche/_utils/search.params.utils"
import { seoH2Sx, seoHrSx, seoSectionSx, seoThreeColGridSx } from "@/app/(editorial)/alternance/_components/hub-styles"
import type { ISeoSecteurJson } from "@/app/(editorial)/alternance/secteur/[secteur]/_components/secteur.types"

type Props = Pick<ISeoSecteurJson, "secteur" | "villes" | "q_recherche"> & { utmParams: string }

export function VillesSecteurSection({ secteur, villes, q_recherche, utmParams }: Props) {
  if (!villes?.length) return null

  return (
    <Box sx={seoSectionSx}>
      <Typography component="h2" variant="h2" sx={seoH2Sx}>
        Où trouver une alternance en <span style={{ color: fr.colors.decisions.text.default.info.default }}>{secteur}</span> ?
      </Typography>
      <Box aria-hidden="true" component="hr" sx={seoHrSx} />
      <Box sx={seoThreeColGridSx}>
        {villes.map((ville) => (
          // Le compteur porte sur le secteur : la tuile mène donc à la recherche du secteur autour de la ville, pas à la page ville générique.
          <Card
            key={ville.nom}
            border
            enlargeLink
            size="small"
            titleAs="h3"
            title={ville.nom}
            desc={`${ville.job_count} offres en alternance en ${secteur}`}
            linkProps={{
              href: `${buildSearchUrl({ mode: "emplois", q: q_recherche, is_algo_company: [false], radius: 30, page: 0, hitsPerPage: 20, latitude: ville.geopoint.lat, longitude: ville.geopoint.long, lieu_label: ville.nom })}&${utmParams}`,
            }}
            style={{ height: "100%" }}
          />
        ))}
      </Box>
    </Box>
  )
}
