import { fr } from "@codegouvfr/react-dsfr"
import { Card } from "@codegouvfr/react-dsfr/Card"
import { Box, Typography } from "@mui/material"
import type { IGetRoutes, IResponse } from "shared"
import { JOB_START_TYPE } from "shared"
import type { LBA_ITEM_TYPE } from "shared/constants/lbaitem"
import { newItemTypeToOldItemType } from "shared/constants/lbaitem"

import { CardStyling } from "@/app/(candidat)/(recherche)/recherche/_components/RechercheResultats/CardStyling"
import type { ILbaItem } from "@/app/(candidat)/(recherche)/recherche/_hooks/useRechercheResults"
import ItemDetailApplicationsStatus from "@/components/ItemDetail/ItemDetailServices/ItemDetailApplicationStatus"
import { LbaJobEngagementTag } from "@/components/ItemDetail/LbaJobComponents/LbaJobEngagementTag"
import { TagCandidatureSpontanee } from "@/components/ItemDetail/TagCandidatureSpontanee"
import { TagEmploiFormation } from "@/components/ItemDetail/TagEmploiFormation"
import { TagFormation } from "@/components/ItemDetail/TagFormation"
import { TagOffreEmploi } from "@/components/ItemDetail/TagOffreEmploi"
import { TagRecrutementUrgent } from "@/components/ItemDetail/TagRecrutementUrgent"
import { getDaysSinceDate } from "@/utils/dateUtils"

import type { ISearchPageParams } from "../_utils/search.params.utils"
import { buildHitDetailUrl, buildSearchUrl } from "../_utils/search.params.utils"

type SearchResponse = IResponse<IGetRoutes["/v1/search"]>
export type Hit = SearchResponse["hits"][number]

interface SearchHitCardProps {
  hit: Hit
  currentParams: ISearchPageParams
}

const isAlgoCompany = (hit: Hit) => hit.is_algo_company === true
const isFormation = (hit: Hit) => hit.type === "formation"

// Mêmes badges que la carte legacy (composants feuilles réutilisés), pilotés par les
// champs de search_items au lieu de l'ideaType legacy.
function HitTags({ hit }: { hit: Hit }) {
  const tags: React.ReactNode[] = []

  if (isAlgoCompany(hit)) tags.push(<TagCandidatureSpontanee key="candidature-spontanee" />)
  else if (isFormation(hit)) tags.push(<TagFormation key="formation" />)
  else if (hit.is_formation_included) tags.push(<TagEmploiFormation key="emploi-formation" />)
  else tags.push(<TagOffreEmploi key="offre-emploi" />)

  if (hit.is_disabled_elligible) tags.push(<LbaJobEngagementTag key="handi" />)
  if (hit.start_type === JOB_START_TYPE.DES_QUE_POSSIBLE) tags.push(<TagRecrutementUrgent key="urgent" />)

  return <Box sx={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>{tags}</Box>
}

function CompanyLine({ hit }: { hit: Hit }) {
  // Candidature spontanée : le titre est déjà le nom d'entreprise → on affiche le secteur.
  if (isAlgoCompany(hit)) return <>Secteur d'activité : {hit.activity_sector ?? ""}</>
  return hit.organization_name ? <>{hit.organization_name}</> : <i>Offre anonyme</i>
}

function DatePublication({ hit }: { hit: Hit }) {
  // Comme en legacy : offres uniquement — la publication_date des candidatures spontanées
  // est une date d'import, celle des formations est nulle.
  if (isFormation(hit) || isAlgoCompany(hit) || !hit.publication_date) return null
  const daysPublished = getDaysSinceDate(new Date(hit.publication_date))

  return (
    <Typography component="span" sx={{ color: fr.colors.decisions.text.mention.grey.default, py: fr.spacing("1v") }} className={fr.cx("fr-text--xs")}>
      Publiée {daysPublished ? `depuis ${daysPublished} jour(s)` : "aujourd'hui"}
    </Typography>
  )
}

function CandidatureCount({ hit }: { hit: Hit }) {
  if (!hit.smart_apply || hit.application_count == null) return null

  return (
    <Typography
      component="span"
      sx={{ whiteSpace: "nowrap", color: fr.colors.decisions.text.default.info.default, py: fr.spacing("1v") }}
      className={fr.cx("fr-text--xs", "fr-text--bold", "fr-icon-flashlight-fill", "fr-icon--sm")}
    >
      {`${hit.application_count} CANDIDATURE${hit.application_count > 1 ? "S" : ""}`}
    </Typography>
  )
}

export function SearchHitCard({ hit, currentParams }: SearchHitCardProps) {
  const currentSearchUrl = buildSearchUrl(currentParams)
  const detailUrl = buildHitDetailUrl({ sub_type: hit.sub_type ?? "", url_id: hit.url_id ?? "", title: hit.title ?? "" }, currentSearchUrl)

  // Encart « déjà postulé » legacy réutilisé tel quel : il ne consomme que ideaType, id et
  // contact.hasEmail — reconstruits depuis le hit (mêmes clés localStorage que le legacy →
  // historique de candidatures partagé entre les deux moteurs).
  const applicationStatusItem = {
    ideaType: newItemTypeToOldItemType(hit.sub_type as LBA_ITEM_TYPE),
    id: hit.url_id,
    contact: { hasEmail: hit.smart_apply === true },
  } as unknown as ILbaItem

  // Même composition que LbaItemCard (legacy) : wrapper zIndex + CardStyling (padding de
  // contenu 16px) + Card DSFR — hauteur et padding identiques aux cartes de /recherche.
  return (
    <Box sx={{ my: fr.spacing("2v"), ".fr-card__title a::before": { zIndex: "unset" } }}>
      <CardStyling>
        <Card
          background
          style={{ paddingBottom: fr.spacing("1v") }}
          shadow
          enlargeLink
          horizontal
          linkProps={{ href: detailUrl, prefetch: false }}
          start={<HitTags hit={hit} />}
          title={
            <Typography component="span" className={fr.cx("fr-text--bold", "fr-text--md")} sx={{ color: fr.colors.decisions.text.actionHigh.grey.default }}>
              {hit.title ?? ""}
            </Typography>
          }
          desc={
            <Box component="span" sx={{ display: "flex", flexDirection: "column", gap: fr.spacing("3v") }}>
              <Typography component="span" className={fr.cx("fr-text--sm")} color={fr.colors.decisions.text.actionHigh.grey.default}>
                <CompanyLine hit={hit} />
              </Typography>
              <Typography component="span" sx={{ color: fr.colors.decisions.text.title.grey.default }} className={fr.cx("fr-text--xs")}>
                {hit.address}
                {hit.distance != null && (
                  <>
                    <br />
                    <Typography component="span" sx={{ my: 0, fontWeight: 400, color: fr.colors.decisions.text.mention.grey.default }} className={fr.cx("fr-text--xs")}>
                      {hit.distance} km(s) du lieu de recherche
                    </Typography>
                  </>
                )}
              </Typography>

              <Box
                component="span"
                sx={{
                  alignItems: { xs: "left", sm: "left", md: "center" },
                  gap: { xs: fr.spacing("2v"), md: fr.spacing("1v") },
                  display: "flex",
                  flexDirection: { xs: "column", md: "row" },
                }}
              >
                <DatePublication hit={hit} />
                <CandidatureCount hit={hit} />
                <ItemDetailApplicationsStatus item={applicationStatusItem} />
              </Box>
            </Box>
          }
          size="medium"
        />
      </CardStyling>
    </Box>
  )
}
