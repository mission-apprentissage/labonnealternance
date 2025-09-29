import { fr } from "@codegouvfr/react-dsfr"
import { Card } from "@codegouvfr/react-dsfr/Card"
import { Box, Typography } from "@mui/material"
import { LBA_ITEM_TYPE, LBA_ITEM_TYPE_OLD } from "shared/constants/lbaitem"

import { CardStyling } from "@/app/(candidat)/(recherche)/recherche/_components/RechercheResultats/CardStyling"
import { ILbaItem } from "@/app/(candidat)/(recherche)/recherche/_hooks/useRechercheResults"
import { useResultItemUrl } from "@/app/(candidat)/(recherche)/recherche/_hooks/useResultItemUrl"
import type { WithRecherchePageParams } from "@/app/(candidat)/(recherche)/recherche/_utils/recherche.route.utils"
import ItemDetailApplicationsStatus from "@/components/ItemDetail/ItemDetailServices/ItemDetailApplicationStatus"
import { LbaItemTags } from "@/components/ItemDetail/ItemDetailServices/LbaItemTags"
import { getDaysSinceDate } from "@/utils/dateUtils"

type ResultCardProps = WithRecherchePageParams<{
  active: boolean
  item: ILbaItem
}>

function getTitle(item: ILbaItem) {
  if (item.ideaType === LBA_ITEM_TYPE_OLD.LBA || item.ideaType === LBA_ITEM_TYPE.RECRUTEURS_LBA) {
    return item.company.name
  }

  if (item.ideaType === LBA_ITEM_TYPE_OLD.FORMATION) {
    return item.title || item.longTitle
  }

  return item.title
}

function ItemCompanyName({ item }: Pick<ResultCardProps, "item">) {
  if (item.ideaType === LBA_ITEM_TYPE_OLD.LBA || item.ideaType === LBA_ITEM_TYPE.RECRUTEURS_LBA) {
    // @ts-expect-error strict mode
    return `Secteur d'activité : ${item?.nafs?.[0]?.label ?? ""}`
  }

  return item.company?.name == null ? <i>Offre anonyme</i> : item.company?.name
}

function getAdresse(item: ILbaItem) {
  if (item.ideaType === LBA_ITEM_TYPE_OLD.LBA || item.ideaType === LBA_ITEM_TYPE.RECRUTEURS_LBA || item.ideaType === LBA_ITEM_TYPE_OLD.FORMATION) {
    return item.place.fullAddress
  }

  if (item?.company?.mandataire) {
    return item.place.city
  }

  return item.place.fullAddress
}

function CandidatureCount({ item }: Pick<ResultCardProps, "item">) {
  if (
    item.ideaType === LBA_ITEM_TYPE_OLD.LBA ||
    item.ideaType === LBA_ITEM_TYPE.RECRUTEURS_LBA ||
    item.ideaType === LBA_ITEM_TYPE_OLD.MATCHA ||
    item.ideaType === LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA
  ) {
    return (
      <Typography
        component="span"
        sx={{
          whiteSpace: "nowrap",
          color: fr.colors.decisions.text.default.info.default,
          py: fr.spacing("1v"),
        }}
        className={fr.cx("fr-text--xs", "fr-text--bold", "fr-icon-flashlight-fill", "fr-icon--sm")}
      >
        {`${item.applicationCount} CANDIDATURE${item.applicationCount > 1 ? "S" : ""}`}
      </Typography>
    )
  }

  return null
}

function DatePublication({ item }: Pick<ResultCardProps, "item">) {
  if (item.ideaType !== LBA_ITEM_TYPE_OLD.MATCHA && item.ideaType !== LBA_ITEM_TYPE_OLD.PARTNER_JOB) {
    return null
  }

  if (!item?.job?.creationDate) {
    return null
  }

  const daysPublished = getDaysSinceDate(item.job.creationDate)

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
}

const activeStyle = {
  "& > div": {
    backgroundColor: fr.colors.decisions.background.alt.blueFrance.default,
    border: `1px solid ${fr.colors.decisions.border.open.blueFrance.default}`,
    "&:hover": { backgroundColor: fr.colors.decisions.background.contrast.blueFrance.default },
    "&:active": { backgroundColor: fr.colors.decisions.background.alt.blueFrance.hover },
  },
}

export function ResultCard({ item, active, rechercheParams }: ResultCardProps) {
  const itemUrl = useResultItemUrl(item, rechercheParams)

  return (
    <Box
      sx={{
        ".fr-card__title a::before": { zIndex: "unset" },
        ...(active ? activeStyle : null),
      }}
    >
      <CardStyling>
        <Card
          background
          style={{ paddingBottom: fr.spacing("1v") }}
          border
          enlargeLink
          horizontal
          linkProps={{
            href: itemUrl,
            prefetch: false,
          }}
          start={<LbaItemTags item={item} displayTooltips={true} />}
          title={
            <Typography
              component="span"
              className={fr.cx("fr-text--bold", "fr-text--md")}
              sx={{
                color: fr.colors.decisions.text.actionHigh.grey.default,
              }}
            >
              {getTitle(item)}
            </Typography>
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
                <ItemCompanyName item={item} />
              </Typography>
              <Typography
                component="span"
                sx={{
                  color: fr.colors.decisions.text.title.grey.default,
                }}
                className={fr.cx("fr-text--xs")}
              >
                {getAdresse(item)}
                {rechercheParams.geo && item.place.distance != null && (
                  <>
                    <br />
                    <Typography
                      component="span"
                      sx={{
                        my: 0,
                        fontWeight: 400,
                        color: fr.colors.decisions.text.mention.grey.default,
                      }}
                      className={fr.cx("fr-text--xs")}
                    >
                      {item.place.distance} km(s) du lieu de recherche
                    </Typography>
                  </>
                )}
              </Typography>

              <Box
                component="span"
                sx={{ alignItems: { xs: "left", sm: "left", md: "center" }, display: "flex", gap: fr.spacing("2w"), flexDirection: { xs: "column", sm: "column", md: "row" } }}
              >
                <DatePublication item={item} />
                <CandidatureCount item={item} />
                <ItemDetailApplicationsStatus item={item} />
              </Box>
            </Box>
          }
          shadow
          size="medium"
        />
      </CardStyling>
    </Box>
  )
}
