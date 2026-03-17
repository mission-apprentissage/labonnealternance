import { fr } from "@codegouvfr/react-dsfr"
import Card from "@codegouvfr/react-dsfr/Card"
import { Box, Typography } from "@mui/material"
import { JOBPARTNERS_LABEL } from "shared/models/jobsPartners.model"
import { CardStyling } from "@/app/(candidat)/(recherche)/recherche/_components/RechercheResultats/CardStyling"
import { TagCandidatureSpontanee } from "@/components/ItemDetail/TagCandidatureSpontanee"
import { TagLaBonneAlternance } from "@/components/ItemDetail/TagLaBonneAlternance"
import { TagOffreEmploi } from "@/components/ItemDetail/TagOffreEmploi"
import { TagPartenaire } from "@/components/ItemDetail/TagPartenaire"
import { publicConfig } from "@/config.public"
import { getDaysSinceDate } from "@/utils/dateUtils"

const CarteOffre = ({ card }) => {
  return (
    <CardStyling>
      <Card
        background
        style={{ paddingBottom: fr.spacing("1v") }}
        border
        enlargeLink
        horizontal
        linkProps={{
          "aria-label":
            card.partner_label === JOBPARTNERS_LABEL.RECRUTEURS_LBA
              ? `Voir la société ${card.workplace_name}`
              : `Voir l'offre d'emploi ${card.offer_title} chez ${card.workplace_name}`,
          href: card?.lba_url?.substring(publicConfig?.baseUrl?.length || 0) || "#",
          prefetch: false,
        }}
        start={
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              flexWrap: "wrap",
              px: fr.spacing("2v"),
              py: fr.spacing("1v"),
              "& > *": {
                marginRight: "4px",
                marginBottom: "4px",
                minWidth: "fit-content",
              },
            }}
          >
            {card.partner_label === JOBPARTNERS_LABEL.RECRUTEURS_LBA ? <TagCandidatureSpontanee key="candidature spontanée" /> : <TagOffreEmploi key="offre emploi" />}
            {card.partner_label === JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA && <TagLaBonneAlternance key="tag la bonne alternance" />}
            {card.partner_label !== JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA && card.partner_label !== JOBPARTNERS_LABEL.RECRUTEURS_LBA && <TagPartenaire key="tag partenaire" />}
          </Box>
        }
        title={
          <Typography
            component="span"
            className={fr.cx("fr-text--bold", "fr-text--md")}
            sx={{
              color: fr.colors.decisions.text.actionHigh.grey.default,
            }}
            dangerouslySetInnerHTML={{ __html: card.partner_label === JOBPARTNERS_LABEL.RECRUTEURS_LBA ? card.workplace_naf_label : card.offer_title }}
          />
        }
        desc={
          <Box
            component="span"
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: fr.spacing("3v"),
            }}
          >
            <Typography component="span" className={fr.cx("fr-text--sm")} color={fr.colors.decisions.text.actionHigh.grey.default}>
              <Typography dangerouslySetInnerHTML={{ __html: card.workplace_name || "" }} />
            </Typography>
            <Typography
              component="span"
              sx={{
                color: fr.colors.decisions.text.title.grey.default,
              }}
              className={fr.cx("fr-text--xs")}
            >
              {`${card.workplace_address_city || ""} ${card.workplace_address_zipcode || ""}`}
            </Typography>

            <Box
              component="span"
              sx={{ alignItems: { xs: "left", sm: "left", md: "center" }, display: "flex", gap: fr.spacing("2v"), flexDirection: { xs: "column", sm: "column", md: "row" } }}
            >
              {card.offer_creation &&
                (() => {
                  const daysPublished = getDaysSinceDate(card.offer_creation)
                  return (
                    <Typography
                      component="span"
                      sx={{
                        color: fr.colors.decisions.text.mention.grey.default,
                        py: fr.spacing("1v"),
                      }}
                      className={fr.cx("fr-text--xs")}
                    >
                      Publiée {`${daysPublished ? `depuis ${daysPublished} jour(s)` : "aujourd'hui"}`}
                    </Typography>
                  )
                })()}
              {[JOBPARTNERS_LABEL.RECRUTEURS_LBA, JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA].includes(card.partner_label) && (
                <Typography
                  component="span"
                  sx={{
                    whiteSpace: "nowrap",
                    color: fr.colors.decisions.text.default.info.default,
                    py: fr.spacing("1v"),
                  }}
                  className={fr.cx("fr-text--xs", "fr-text--bold", "fr-icon-flashlight-fill", "fr-icon--sm")}
                >
                  {`${card.application_count} CANDIDATURE${card.application_count > 1 ? "S" : ""}`}
                </Typography>
              )}
            </Box>
          </Box>
        }
        shadow
        size="medium"
      />
    </CardStyling>
  )
}

export default CarteOffre
