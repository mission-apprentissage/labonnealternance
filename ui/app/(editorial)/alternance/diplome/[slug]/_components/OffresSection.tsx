import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import { Box } from "@mui/material"
import { JOBPARTNERS_LABEL } from "shared/models/jobsPartners.model"

import CarteOffre from "@/app/(editorial)/alternance/_components/CarteOffre"

import { UTM_PARAMS } from "../_data/constants"
import { SectionTitle } from "./SectionTitle"

export function OffresSection({ offreCount, offres }: { offreCount: number; offres: any[] }) {
  // TODO: Remplacer par de vraies offres via apiGet
  const placeholderOffres = [
    {
      partner_label: JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA,
      offer_title: "Développeur en Alternance (H/F)",
      workplace_name: "DAILYVERY",
      workplace_naf_label: "DAILYVERY",
      workplace_address_city: "RILLIEUX-LA-PAPE",
      workplace_address_zipcode: "69140",
      offer_creation: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      application_count: 0,
      lba_url: "/recherche-emploi",
    },
    {
      partner_label: JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA,
      offer_title: "Développeur Web & Odoo",
      workplace_name: "LES ARTISANS PROS",
      workplace_naf_label: "LES ARTISANS PROS",
      workplace_address_city: "PARIS",
      workplace_address_zipcode: "75014",
      offer_creation: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      application_count: 0,
      lba_url: "/recherche-emploi",
    },
    {
      partner_label: JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA,
      offer_title: "logiciel C++/QT pour des systèmes embarqués, des applications et objets connectés",
      workplace_name: "SUD MULTI SERVICE INGENIERIE",
      workplace_naf_label: "SUD MULTI SERVICE INGENIERIE",
      workplace_address_city: "NIMES",
      workplace_address_zipcode: "30900",
      offer_creation: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      application_count: 0,
      lba_url: "/recherche-emploi",
    },
    {
      partner_label: JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA,
      offer_title: "Développeur en Alternance (H/F)",
      workplace_name: "DAILYVERY",
      workplace_naf_label: "DAILYVERY",
      workplace_address_city: "RILLIEUX-LA-PAPE",
      workplace_address_zipcode: "69140",
      offer_creation: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      application_count: 0,
      lba_url: "/recherche-emploi",
    },
    {
      partner_label: JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA,
      offer_title: "Développeur Web & Odoo",
      workplace_name: "LES ARTISANS PROS",
      workplace_naf_label: "LES ARTISANS PROS",
      workplace_address_city: "PARIS",
      workplace_address_zipcode: "75014",
      offer_creation: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      application_count: 0,
      lba_url: "/recherche-emploi",
    },
    {
      partner_label: JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA,
      offer_title: "logiciel C++/QT pour des systèmes embarqués, des applications et objets connectés",
      workplace_name: "SUD MULTI SERVICE INGENIERIE",
      workplace_naf_label: "SUD MULTI SERVICE INGENIERIE",
      workplace_address_city: "NIMES",
      workplace_address_zipcode: "30900",
      offer_creation: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      application_count: 0,
      lba_url: "/recherche-emploi",
    },
    {
      partner_label: JOBPARTNERS_LABEL.RECRUTEURS_LBA,
      offer_title: "",
      workplace_name: "DAILYVERY",
      workplace_naf_label: "DAILYVERY",
      workplace_address_city: "RILLIEUX-LA-PAPE",
      workplace_address_zipcode: "69140",
      offer_creation: null,
      application_count: 0,
      lba_url: "/recherche-emploi",
    },
    {
      partner_label: JOBPARTNERS_LABEL.RECRUTEURS_LBA,
      offer_title: "",
      workplace_name: "LES ARTISANS PROS",
      workplace_naf_label: "LES ARTISANS PROS",
      workplace_address_city: "PARIS",
      workplace_address_zipcode: "75014",
      offer_creation: null,
      application_count: 0,
      lba_url: "/recherche-emploi",
    },
    {
      partner_label: JOBPARTNERS_LABEL.RECRUTEURS_LBA,
      offer_title: "",
      workplace_name: "SUD MULTI SERVICE INGENIERIE",
      workplace_naf_label: "SUD MULTI SERVICE INGENIERIE",
      workplace_address_city: "NIMES",
      workplace_address_zipcode: "30900",
      offer_creation: null,
      application_count: 0,
      lba_url: "/recherche-emploi",
    },
  ]

  return (
    <Box>
      <SectionTitle title={`Découvrez les ${offreCount} offres disponibles pour ce diplôme`} />

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" }, gap: fr.spacing("3v"), mb: fr.spacing("8v"), alignItems: "start" }}>
        {placeholderOffres.map((offre, i) => (
          <CarteOffre key={i} card={offre} utmParams={UTM_PARAMS} />
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
