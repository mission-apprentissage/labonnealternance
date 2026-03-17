import { fr } from "@codegouvfr/react-dsfr"
import { Box } from "@mui/material"
import Link from "next/link"
import type { IGetRoutes, IResponse } from "shared"

import { getDaysSinceDate } from "@/utils/dateUtils"

import type { ISearchPageParams } from "../_utils/search.params.utils"
import { buildHitDetailUrl, buildSearchUrl } from "../_utils/search.params.utils"
import { SearchHitPreview } from "./SearchHitPreview"

type SearchResponse = IResponse<IGetRoutes["/v1/search"]>
export type Hit = SearchResponse["hits"][number]

interface SearchHitCardProps {
  hit: Hit
  currentParams: ISearchPageParams
}

function formatPublicationDate(date: Date | string | null | undefined): string | null {
  if (!date) return null
  const days = getDaysSinceDate(new Date(date))
  if (days === 0) return "Aujourd'hui"
  if (days === 1) return "Hier"
  return `Il y a ${days} jours`
}

function getTypeBadgeColor(type?: string): string {
  if (type === "offre") return fr.colors.decisions.background.actionHigh.blueFrance.default
  return fr.colors.decisions.background.actionHigh.greenTilleulVerveine.default
}

export function SearchHitCard({ hit, currentParams }: SearchHitCardProps) {
  const currentSearchUrl = buildSearchUrl(currentParams)
  const detailUrl = buildHitDetailUrl({ sub_type: hit.sub_type ?? "", url_id: hit.url_id ?? "", title: hit.title ?? "" }, currentSearchUrl)

  const publicationDateStr = formatPublicationDate(hit.publication_date)
  const _titleContent = hit.preview && hit.preview.length > 0 ? <SearchHitPreview preview={hit.preview} /> : (hit.title ?? "")

  return (
    <Link href={detailUrl} style={{ textDecoration: "none", color: "inherit", display: "block" }}>
      <Box
        sx={{
          border: `1px solid ${fr.colors.decisions.border.default.grey.default}`,
          borderRadius: "4px",
          p: fr.spacing("4v"),
          mb: fr.spacing("3v"),
          backgroundColor: fr.colors.decisions.background.default.grey.default,
          transition: "box-shadow 0.15s ease",
          "&:hover": {
            boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
            borderColor: fr.colors.decisions.border.actionHigh.blueFrance.default,
          },
          cursor: "pointer",
        }}
      >
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: fr.spacing("1v"), mb: fr.spacing("2v") }}>
          <span className={fr.cx("fr-badge", "fr-badge--sm")} style={{ backgroundColor: getTypeBadgeColor(hit.type), color: "#fff" }}>
            {hit.type_filter_label}
          </span>
          {hit.contract_type?.map((ct) => (
            <span key={ct} className={fr.cx("fr-badge", "fr-badge--sm")}>
              {ct}
            </span>
          ))}
        </Box>

        <Box
          sx={{
            fontSize: "1rem",
            fontWeight: 600,
            color: fr.colors.decisions.text.actionHigh.blueFrance.default,
            mb: fr.spacing("1v"),
            lineHeight: 1.4,
          }}
        >
          {hit.title}
        </Box>

        <Box sx={{ color: fr.colors.decisions.text.default.grey.default, fontSize: "0.875rem", mb: fr.spacing("1v") }}>
          {hit.organization_name}
          {hit.address && ` · ${hit.address}`}
        </Box>

        {(hit.application_count != null || publicationDateStr) && (
          <Box sx={{ display: "flex", gap: fr.spacing("3v"), color: fr.colors.decisions.text.mention.grey.default, fontSize: "0.8125rem" }}>
            {hit.application_count != null && (
              <span>
                {hit.application_count} candidature{(hit.application_count ?? 0) > 1 ? "s" : ""}
              </span>
            )}
            {publicationDateStr && <span>{publicationDateStr}</span>}
          </Box>
        )}
      </Box>
    </Link>
  )
}
