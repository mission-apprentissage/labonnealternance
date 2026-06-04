import { fr } from "@codegouvfr/react-dsfr"
import { Box } from "@mui/material"
import Link from "next/link"
import type { IGetRoutes, IResponse } from "shared"
import { LBA_ITEM_TYPE } from "shared/constants/lbaitem"

import type { ISearchPageParams } from "../_utils/search.params.utils"
import { buildHitDetailUrl, buildSearchUrl } from "../_utils/search.params.utils"
import { SearchHitPreview } from "./SearchHitPreview"

type SearchResponse = IResponse<IGetRoutes["/v1/search"]>
export type Hit = SearchResponse["hits"][number]

interface SearchHitCardProps {
  hit: Hit
  currentParams: ISearchPageParams
  isSelected?: boolean
  onSelect?: (hit: Hit) => void
}

export function SearchHitCard({ hit, currentParams, isSelected, onSelect }: SearchHitCardProps) {
  const currentSearchUrl = buildSearchUrl(currentParams)
  const detailUrl = buildHitDetailUrl({ sub_type: hit.sub_type ?? "", url_id: hit.url_id ?? "", title: hit.title ?? "" }, currentSearchUrl)

  const isFormation = hit.type === LBA_ITEM_TYPE.FORMATION
  const titleContent = hit.preview && hit.preview.length > 0 ? <SearchHitPreview preview={hit.preview} /> : (hit.title ?? "")

  // Accent gauche bleu france via box-shadow inset (sélection) : conserve le box 1px
  // complet sur les 4 côtés — pas de bord gauche manquant ni de décalage de contenu.
  const accent = `inset 3px 0 0 0 ${fr.colors.decisions.border.actionHigh.blueFrance.default}`
  const elevation = "0 2px 8px rgba(0,0,0,0.12)"

  const cardContent = (
    <Box
      sx={{
        position: "relative",
        border: `1px solid ${fr.colors.decisions.border.default.grey.default}`,
        borderRadius: "4px",
        p: fr.spacing("4v"),
        pr: fr.spacing("8v"),
        mb: fr.spacing("3v"),
        backgroundColor: isSelected ? fr.colors.decisions.background.alt.blueFrance.default : fr.colors.decisions.background.default.grey.default,
        boxShadow: isSelected ? accent : "none",
        transition: "box-shadow 0.12s ease, border-color 0.12s ease",
        "&:hover": {
          boxShadow: isSelected ? `${accent}, ${elevation}` : elevation,
        },
        cursor: "pointer",
      }}
    >
      <span className={fr.cx("fr-badge", "fr-badge--sm", isFormation ? "fr-badge--success" : "fr-badge--info")}>{isFormation ? "Formation" : "Offre d'emploi"}</span>

      <Box
        sx={{
          mt: fr.spacing("2v"),
          mb: fr.spacing("1v"),
          fontSize: "0.9375rem",
          fontWeight: 700,
          color: fr.colors.decisions.text.title.grey.default,
          lineHeight: 1.3,
        }}
      >
        {titleContent}
      </Box>

      <Box sx={{ color: fr.colors.decisions.text.mention.grey.default, fontSize: "0.8125rem", lineHeight: 1.4 }}>
        {hit.organization_name}
        {hit.address && ` · ${hit.address}`}
      </Box>

      {hit.distance != null && (
        <Box sx={{ mt: fr.spacing("1v"), color: fr.colors.decisions.text.mention.grey.default, fontSize: "0.75rem", lineHeight: 1.4 }}>
          {hit.distance} km(s) du lieu de recherche
        </Box>
      )}

      <Box
        component="span"
        className={fr.cx("fr-icon-arrow-right-line")}
        aria-hidden="true"
        sx={{
          position: "absolute",
          right: fr.spacing("3v"),
          top: "50%",
          transform: "translateY(-50%)",
          color: fr.colors.decisions.text.actionHigh.blueFrance.default,
        }}
      />
    </Box>
  )

  if (onSelect) {
    return (
      <Box onClick={() => onSelect(hit)} sx={{ textDecoration: "none", color: "inherit", display: "block" }}>
        {cardContent}
      </Box>
    )
  }

  return (
    <Link href={detailUrl} style={{ textDecoration: "none", color: "inherit", display: "block" }}>
      {cardContent}
    </Link>
  )
}
