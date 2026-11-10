"use client"

import { fr } from "@codegouvfr/react-dsfr"
import { Box, Link, Stack, Typography } from "@mui/material"
import type { SortingState } from "@tanstack/react-table"
import dayjs from "dayjs"
import type { ReactNode } from "react"
import type { IModerationQueueSort } from "shared/routes/jobs-partners-moderation.routes"
import { MODERATION_QUEUE_SORTS } from "shared/routes/jobs-partners-moderation.routes"
import type { ColumnDef } from "@/app/(espace-pro)/_components/VirtualTable"
import { VirtualTable } from "@/app/(espace-pro)/_components/VirtualTable"
import { PaginationButton } from "@/app/(espace-pro)/espace-pro/(connected)/administration/_components/PaginationButton"
import { MODERATION_PAGES } from "@/utils/moderation-pages.utils"
import { AccountStatusBadge, AccountTypeBadge, ConformityBadge, OfferStatusBadge } from "./ModerationBadges"
import type { IModerationQueueItemJson, IModerationUserType } from "./moderation.types"

export const MODERATION_PAGE_SIZE = 50
export const MODERATION_DEFAULT_SORTING: SortingState = [{ id: "created_at", desc: true }]

const isModerationSort = (id: string | undefined): id is IModerationQueueSort => MODERATION_QUEUE_SORTS.includes(id as IModerationQueueSort)

export const getModerationPagination = (total: number, offset: number) => ({
  pageCount: Math.max(1, Math.ceil(total / MODERATION_PAGE_SIZE)),
  currentPage: Math.floor(offset / MODERATION_PAGE_SIZE) + 1,
})

/** Tri côté serveur de la file et de la recherche, lu dans l'état du tableau. */
export const toModerationSort = ([current]: SortingState): { sort: IModerationQueueSort; order: "asc" | "desc" } => ({
  sort: isModerationSort(current?.id) ? current.id : "created_at",
  order: current?.desc === false ? "asc" : "desc",
})

// Tri côté serveur : accessorFn ne sert qu'à rendre la colonne triable (cf. VirtualTable, onSortingChange).
export const getModerationColumns = (userType: IModerationUserType, renderMenu: (row: IModerationQueueItemJson) => ReactNode): ColumnDef<IModerationQueueItemJson>[] => [
  {
    id: "action",
    header: "",
    meta: { srOnly: "Actions sur l’offre" },
    size: 50,
    enableSorting: false,
    cell: (info) => renderMenu(info.row.original),
  },
  {
    id: "offer_title",
    header: "Intitulé de l’offre / ROME",
    accessorFn: (row) => row.offer_title,
    size: 280,
    cell: (info) => {
      const { _id, offer_title, offer_rome_appellation } = info.row.original
      return (
        <Stack spacing={0.5}>
          <Link underline="hover" fontWeight={700} fontSize=".875rem" href={MODERATION_PAGES.offre({ job_id: _id, userType }).getPath()}>
            {offer_title}
          </Link>
          {offer_rome_appellation && <Typography sx={{ color: "#666666", fontSize: ".75rem" }}>{offer_rome_appellation}</Typography>}
        </Stack>
      )
    },
  },
  {
    id: "offer_status",
    header: "Statut de l’offre",
    accessorFn: (row) => row.offer_status,
    size: 140,
    cell: (info) => <OfferStatusBadge status={info.row.original.offer_status} />,
  },
  {
    id: "conformity",
    header: "Conformité",
    accessorFn: (row) => row.offer_moderation_status,
    size: 170,
    cell: (info) => <ConformityBadge verdict={info.row.original.offer_moderation_verdict} status={info.row.original.offer_moderation_status} />,
  },
  {
    id: "created_at",
    header: "Postée le",
    accessorFn: (row) => row.created_at,
    size: 120,
    cell: (info) => <Typography sx={{ fontSize: ".875rem" }}>{dayjs(info.row.original.created_at).format("DD/MM/YYYY")}</Typography>,
  },
  {
    id: "recruiter",
    header: "Recruteur",
    accessorFn: (row) => row.recruiter.raison_sociale,
    size: 280,
    cell: (info) => {
      const { recruiter } = info.row.original
      return (
        <Stack spacing={0.5}>
          <Typography sx={{ fontSize: ".75rem", fontWeight: 700, textTransform: "uppercase" }}>{recruiter.raison_sociale ?? "—"}</Typography>
          <Typography sx={{ fontSize: ".75rem", wordBreak: "break-all" }}>{recruiter.email ?? "—"}</Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: fr.spacing("1v") }}>
            <AccountTypeBadge type={recruiter.account_type} />
            <AccountStatusBadge status={recruiter.account_status} />
          </Box>
        </Stack>
      )
    },
  },
]

/** Tableau paginé des offres de la file ou de la recherche, qui reste monté pendant le chargement d'une page (cf. OffresPartenairesList). */
export function ModerationOffersResults({
  title,
  columns,
  jobs,
  total,
  offset,
  onOffsetChange,
  sorting,
  onSortingChange,
  isPageLoading,
}: {
  title: string
  columns: ColumnDef<IModerationQueueItemJson>[]
  jobs: IModerationQueueItemJson[]
  total: number
  offset: number
  onOffsetChange: (offset: number) => void
  sorting: SortingState
  onSortingChange: (sorting: SortingState) => void
  isPageLoading: boolean
}) {
  const { pageCount, currentPage } = getModerationPagination(total, offset)
  return (
    <>
      <Box aria-busy={isPageLoading} sx={{ opacity: isPageLoading ? 0.5 : 1, transition: "opacity .2s" }}>
        <VirtualTable
          caption={`${title} (${total} au total)`}
          columns={columns}
          data={jobs}
          hideSearch
          hideCount
          rowHeight={90}
          sorting={sorting}
          onSortingChange={(next) => {
            onOffsetChange(0)
            onSortingChange(next.length ? next : MODERATION_DEFAULT_SORTING)
          }}
        />
      </Box>
      <Box
        component="nav"
        aria-label={`Pagination des ${title.toLowerCase()}`}
        sx={{ display: "flex", justifyContent: "center", alignItems: "center", gap: fr.spacing("3v"), mt: fr.spacing("4v") }}
      >
        <PaginationButton
          label="Précédent"
          targetPage={currentPage - 1}
          pageCount={pageCount}
          isAvailable={currentPage > 1}
          onClick={() => onOffsetChange(Math.max(0, offset - MODERATION_PAGE_SIZE))}
        />
        <Typography sx={{ fontSize: ".875rem", color: "#666666" }}>{`Page ${currentPage} sur ${pageCount}`}</Typography>
        <PaginationButton
          label="Suivant"
          targetPage={currentPage + 1}
          pageCount={pageCount}
          isAvailable={currentPage < pageCount}
          onClick={() => onOffsetChange(offset + MODERATION_PAGE_SIZE)}
        />
      </Box>
    </>
  )
}
