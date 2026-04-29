import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import { Box, Typography } from "@mui/material"
import Link from "next/link"

import { TagCandidatureSpontanee } from "@/components/ItemDetail/TagCandidatureSpontanee"
import { TagOffreEmploi } from "@/components/ItemDetail/TagOffreEmploi"

import { UTM_PARAMS } from "../_data/constants"
import { SectionTitle } from "./SectionTitle"

function OffreCard({
  offre,
}: {
  offre: { type: string; title: string; company: string; location: string; date?: string; candidatures?: string; candidatureSimplifiee?: boolean; href: string }
}) {
  return (
    <Link href={`${offre.href}?${UTM_PARAMS}`} style={{ textDecoration: "none", backgroundImage: "none" }}>
      <Box
        sx={{
          p: fr.spacing("4v"),
          border: `1px solid ${fr.colors.decisions.border.default.grey.default}`,
          borderRadius: "5px",
          boxShadow: "0 2px 6px 0 rgba(0, 0, 18, 0.16)",
          backgroundColor: fr.colors.decisions.background.default.grey.default,
          display: "flex",
          flexDirection: "column",
          gap: fr.spacing("4v"),
          height: "100%",
          "&:hover": { backgroundColor: fr.colors.decisions.background.default.grey.hover },
        }}
      >
        {/* Badges */}
        <Box sx={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>{offre.type === "emploi" ? <TagOffreEmploi /> : <TagCandidatureSpontanee />}</Box>

        {/* Corps */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: "6px", flex: 1 }}>
          <Typography sx={{ fontWeight: 700, fontSize: "16px", lineHeight: "24px", color: fr.colors.decisions.text.title.grey.default }}>{offre.title}</Typography>
          <Typography
            sx={{ fontSize: "14px", lineHeight: "24px", color: fr.colors.decisions.text.title.grey.default, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
          >
            {offre.company}
          </Typography>
          <Typography sx={{ fontSize: "12px", lineHeight: "20px", color: fr.colors.decisions.text.title.grey.default }}>{offre.location}</Typography>
          <Box sx={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" }}>
            {offre.date && <Typography sx={{ fontSize: "12px", lineHeight: "20px", color: fr.colors.decisions.text.mention.grey.default }}>{offre.date}</Typography>}
            {offre.candidatures && (
              <Typography
                component="span"
                className={fr.cx("fr-icon-flashlight-fill" as any, "fr-icon--sm" as any)}
                sx={{ fontWeight: 700, fontSize: "12px", lineHeight: "20px", color: fr.colors.decisions.text.default.info.default, textTransform: "uppercase" }}
              >
                {offre.candidatures}
              </Typography>
            )}
            {offre.candidatureSimplifiee && (
              <Typography
                component="span"
                className={fr.cx("fr-icon-mail-send-fill" as any, "fr-icon--sm" as any, "fr-text--sm" as any)}
                sx={{
                  backgroundColor: fr.colors.decisions.background.contrast.info.default,
                  color: fr.colors.decisions.background.actionHigh.info.default,
                  whiteSpace: "nowrap",
                  px: fr.spacing("2v"),
                  fontStyle: "italic",
                  width: "fit-content",
                }}
              >
                {" "}
                Candidature simplifiée
              </Typography>
            )}
          </Box>
        </Box>

        {/* Flèche */}
        <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
          <span
            className={fr.cx("fr-icon-arrow-right-line" as any)}
            aria-hidden="true"
            style={{ color: fr.colors.decisions.background.actionHigh.blueFrance.default, fontSize: "24px" }}
          />
        </Box>
      </Box>
    </Link>
  )
}

export function OffresSection() {
  // TODO: Remplacer par de vraies offres via apiGet
  const placeholderOffres = [
    {
      type: "emploi",
      title: "Développeur en Alternance (H/F)",
      company: "DAILYVERY",
      location: "69140 RILLIEUX-LA-PAPE",
      date: "Publiée il y a 2 jours",
      candidatures: "0 candidature",
      candidatureSimplifiee: true,
      href: "/recherche-emploi",
    },
    {
      type: "emploi",
      title: "Développeur Web & Odoo",
      company: "LES ARTISANS PROS",
      location: "75014 PARIS",
      date: "Publiée il y a 3 jours",
      candidatures: "0 candidature",
      candidatureSimplifiee: true,
      href: "/recherche-emploi",
    },
    {
      type: "emploi",
      title: "logiciel C++/QT pour des systèmes embarqués, des applications et objets connectés",
      company: "SUD MULTI SERVICE INGENIERIE",
      location: "30900 NIMES",
      date: "Publiée il y a 5 jours",
      candidatures: "0 candidature",
      candidatureSimplifiee: true,
      href: "/recherche-emploi",
    },
    {
      type: "emploi",
      title: "Développeur en Alternance (H/F)",
      company: "DAILYVERY",
      location: "69140 RILLIEUX-LA-PAPE",
      date: "Publiée il y a 2 jours",
      candidatures: "0 candidature",
      candidatureSimplifiee: true,
      href: "/recherche-emploi",
    },
    {
      type: "emploi",
      title: "Développeur Web & Odoo",
      company: "LES ARTISANS PROS",
      location: "75014 PARIS",
      date: "Publiée il y a 3 jours",
      candidatures: "0 candidature",
      candidatureSimplifiee: true,
      href: "/recherche-emploi",
    },
    {
      type: "emploi",
      title: "logiciel C++/QT pour des systèmes embarqués, des applications et objets connectés",
      company: "SUD MULTI SERVICE INGENIERIE",
      location: "30900 NIMES",
      date: "Publiée il y a 5 jours",
      candidatures: "0 candidature",
      candidatureSimplifiee: true,
      href: "/recherche-emploi",
    },
    {
      type: "spontanee",
      title: "[raison sociale : nom de l'entreprise]",
      company: "DAILYVERY",
      location: "69140 RILLIEUX-LA-PAPE",
      candidatureSimplifiee: true,
      href: "/recherche-emploi",
    },
    {
      type: "spontanee",
      title: "[raison sociale : nom de l'entreprise]",
      company: "LES ARTISANS PROS",
      location: "75014 PARIS",
      candidatureSimplifiee: true,
      href: "/recherche-emploi",
    },
    { type: "spontanee", title: "[raison sociale : nom de l'entreprise]", company: "SUD MULTI SERVICE INGENIERIE", location: "30900 NIMES", href: "/recherche-emploi" },
  ]

  return (
    <Box>
      <SectionTitle title="Découvrez les XXX offres disponibles pour ce diplôme" />

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" }, gap: fr.spacing("3v"), mb: fr.spacing("8v"), alignItems: "start" }}>
        {placeholderOffres.map((offre, i) => (
          <OffreCard key={i} offre={offre} />
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
