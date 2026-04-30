import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import { Box } from "@mui/material"
import type { ISeoJobCard } from "shared/models/seoMetier.model"

import CarteOffre from "@/app/(editorial)/alternance/_components/CarteOffre"

import { UTM_PARAMS } from "../_data/constants"
import { SectionTitle } from "./SectionTitle"

export function OffresSection({ offreCount, offres }: { offreCount: number; offres: ISeoJobCard[] }) {
  return (
    <Box>
      <SectionTitle title={`Découvrez les ${offreCount} offres disponibles pour ce diplôme`} />

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" }, gap: fr.spacing("3v"), mb: fr.spacing("8v"), alignItems: "start" }}>
        {offres.map((offre) => (
          <CarteOffre key={offre._id ?? offre.partner_job_id} card={offre} utmParams={UTM_PARAMS} />
        ))}
      </Box>

      <Box sx={{ textAlign: "center" }}>
        <Button priority="primary" size="large" iconId="fr-icon-arrow-right-line" iconPosition="right" linkProps={{ href: `/recherche-emploi?${UTM_PARAMS}` }}>
          Voir toutes les offres en alternance
        </Button>
      </Box>
    </Box>
  )
}
