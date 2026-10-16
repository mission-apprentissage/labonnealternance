"use client"

import { fr } from "@codegouvfr/react-dsfr"
import Alert from "@codegouvfr/react-dsfr/Alert"
import Button from "@codegouvfr/react-dsfr/Button"
import { Box, CircularProgress, Link, Stack, Typography } from "@mui/material"
import { keepPreviousData, useQuery } from "@tanstack/react-query"
import type { SortingState } from "@tanstack/react-table"
import dayjs from "dayjs"
import { useMemo, useState } from "react"
import { OPCOS_LABEL } from "shared/constants/recruteur"
import { AccessStatus } from "shared/models/role-management.model"
import type { IModerationAccountType, IModerationQueueConformity, IModerationQueueSort } from "shared/routes/jobs-partners-moderation.routes"
import { MODERATION_QUEUE_SORTS } from "shared/routes/jobs-partners-moderation.routes"
import { LiveStatus } from "@/app/_components/LiveStatus"
import type { PopoverMenuAction } from "@/app/(espace-pro)/_components/PopoverMenu"
import { PopoverMenu } from "@/app/(espace-pro)/_components/PopoverMenu"
import type { ColumnDef } from "@/app/(espace-pro)/_components/VirtualTable"
import { VirtualTable } from "@/app/(espace-pro)/_components/VirtualTable"
import { AdminSearchInput } from "@/app/(espace-pro)/espace-pro/(connected)/administration/_components/AdminSearchInput"
import { MultiSelect } from "@/app/(espace-pro)/espace-pro/(connected)/administration/_components/MultiSelect"
import { PaginationButton } from "@/app/(espace-pro)/espace-pro/(connected)/administration/_components/PaginationButton"
import { useToast } from "@/app/hooks/useToast"
import { DsfrIcon } from "@/components/DsfrIcon"
import { getModerationQueue, reclassifyFailedModerationJobs } from "@/utils/api"
import { PAGES } from "@/utils/routes.utils"
import { pluralize } from "@/utils/strutils"
import { AccountStatusBadge, AccountTypeBadge, ConformityBadge, OfferStatusBadge } from "./ModerationBadges"
import type { IModerationQueueItemJson, IModerationUserType } from "./moderation.types"
import { getOfferEditionPath } from "./moderation-links"

const PAGE_SIZE = 50
const DEFAULT_SORTING: SortingState = [{ id: "created_at", desc: true }]

const CONFORMITY_OPTIONS: { value: IModerationQueueConformity; label: string }[] = [
  { value: "non_conforme", label: "Non conforme" },
  { value: "a_verifier", label: "À vérifier" },
  { value: "indisponible", label: "Analyse indisponible" },
]
const ACCOUNT_STATUS_OPTIONS: { value: AccessStatus.AWAITING_VALIDATION | AccessStatus.GRANTED; label: string }[] = [
  { value: AccessStatus.AWAITING_VALIDATION, label: "En attente" },
  { value: AccessStatus.GRANTED, label: "Actif" },
]
const ACCOUNT_TYPE_OPTIONS: { value: IModerationAccountType; label: string }[] = [
  { value: "ENTREPRISE", label: "Entreprise" },
  { value: "CFA", label: "CFA" },
]
const OPCO_OPTIONS = Object.values(OPCOS_LABEL).map((value) => ({ value, label: value }))

const isQueueSort = (id: string | undefined): id is IModerationQueueSort => MODERATION_QUEUE_SORTS.includes(id as IModerationQueueSort)

const ModerationQueueMenu = ({ row, userType }: { row: IModerationQueueItemJson; userType: IModerationUserType }) => {
  const editionPath = getOfferEditionPath(row, row.recruiter, userType)
  // Une offre en modération n'a pas de page publique : seules la modération et l'édition ont un sens (#5499).
  const actions: PopoverMenuAction[] = [
    {
      label: "Modérer l’offre",
      hint: row.offer_title,
      link: PAGES.dynamic.backModerationOffre({ job_id: row._id, userType }).getPath(),
      type: "link",
      icon: <DsfrIcon name="fr-icon-scales-3-line" size={16} />,
    },
    editionPath ? { label: "Éditer l’offre", hint: row.offer_title, link: editionPath, type: "link", icon: <DsfrIcon name="fr-icon-edit-line" size={16} /> } : null,
  ]
  return <PopoverMenu actions={actions} title={`Actions sur l’offre ${row.offer_title}`} />
}

// Tri côté serveur : accessorFn ne sert qu'à rendre la colonne triable (cf. VirtualTable, onSortingChange).
const getColumns = (userType: IModerationUserType): ColumnDef<IModerationQueueItemJson>[] => [
  {
    id: "action",
    header: "",
    meta: { srOnly: "Actions sur l’offre" },
    size: 50,
    enableSorting: false,
    cell: (info) => <ModerationQueueMenu row={info.row.original} userType={userType} />,
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
          <Link underline="hover" fontWeight={700} fontSize=".875rem" href={PAGES.dynamic.backModerationOffre({ job_id: _id, userType }).getPath()}>
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

/** File « Offres à modérer » (#5499). Pour un OPCO, le serveur la limite aux offres de son OPCO. */
export function ModerationQueue({ userType }: { userType: IModerationUserType }) {
  const toast = useToast()
  const [conformity, setConformity] = useState<IModerationQueueConformity[]>([])
  const [accountStatus, setAccountStatus] = useState<(AccessStatus.AWAITING_VALIDATION | AccessStatus.GRANTED)[]>([])
  const [accountType, setAccountType] = useState<IModerationAccountType[]>([])
  const [opco, setOpco] = useState<OPCOS_LABEL[]>([])
  const [search, setSearch] = useState("")
  const [sorting, setSorting] = useState<SortingState>(DEFAULT_SORTING)
  const [offset, setOffset] = useState(0)
  const [isReclassifying, setIsReclassifying] = useState(false)

  const [currentSort] = sorting
  const sort = isQueueSort(currentSort?.id) ? currentSort.id : "created_at"
  const order = currentSort?.desc === false ? "asc" : "desc"

  const { data, isLoading, isError, isPlaceholderData, isFetching } = useQuery({
    queryKey: ["moderation-queue", conformity, accountStatus, accountType, opco, search, sort, order, offset],
    queryFn: () =>
      getModerationQueue({
        conformity: conformity.length ? conformity : undefined,
        account_status: accountStatus.length ? accountStatus : undefined,
        account_type: accountType.length ? accountType : undefined,
        opco: opco.length ? opco : undefined,
        search: search || undefined,
        sort,
        order,
        limit: PAGE_SIZE,
        offset,
      }),
    placeholderData: keepPreviousData,
    retry: false,
  })

  const jobs = data?.jobs ?? []
  const total = data?.pagination.total ?? 0
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const currentPage = Math.floor(offset / PAGE_SIZE) + 1
  const isPageLoading = isFetching && isPlaceholderData
  const columns = useMemo(() => getColumns(userType), [userType])

  const withFirstPage =
    <T,>(setter: (value: T) => void) =>
    (value: T) => {
      setOffset(0)
      setter(value)
    }

  const reclassifyFailed = async () => {
    setIsReclassifying(true)
    try {
      const { pending } = await reclassifyFailedModerationJobs()
      toast(
        pending
          ? { title: `${pluralize(pending, "analyse")} en échec relancée${pending > 1 ? "s" : ""}`, description: "Les résultats apparaîtront dans quelques minutes." }
          : { title: "Aucune analyse en échec à relancer", variant: "info" }
      )
    } catch {
      toast({ title: "La relance n’a pas abouti. Réessayez dans un instant.", variant: "error" })
    } finally {
      setIsReclassifying(false)
    }
  }

  const counter = isLoading || isError ? "" : `${pluralize(total, "offre")} à traiter`

  return (
    <>
      <Box sx={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-end", gap: fr.spacing("4v"), mb: fr.spacing("6v") }}>
        <AdminSearchInput
          label="Rechercher une offre"
          placeholder="Raison sociale, SIRET, e-mail, identifiant"
          hintText="Raison sociale, SIRET, e-mail du recruteur ou identifiant de l’offre, au moins 2 caractères"
          onSearch={withFirstPage(setSearch)}
          onReset={() => withFirstPage(setSearch)("")}
          inputWidth="420px"
        />
        {userType === "ADMIN" && (
          <Button priority="secondary" iconId="fr-icon-refresh-line" onClick={reclassifyFailed} disabled={isReclassifying}>
            Relancer les analyses en échec
          </Button>
        )}
      </Box>
      <Box sx={{ display: "flex", flexWrap: "wrap", columnGap: fr.spacing("4v"), "& > .MuiFormControl-root": { mb: fr.spacing("6v") } }}>
        <MultiSelect id="moderation-conformite" label="Niveau de conformité" width={230} items={CONFORMITY_OPTIONS} value={conformity} onChange={withFirstPage(setConformity)} />
        <MultiSelect
          id="moderation-statut-compte"
          label="Statut du compte recruteur"
          width={230}
          items={ACCOUNT_STATUS_OPTIONS}
          value={accountStatus}
          onChange={withFirstPage(setAccountStatus)}
        />
        <MultiSelect id="moderation-type-compte" label="Type de compte" width={200} items={ACCOUNT_TYPE_OPTIONS} value={accountType} onChange={withFirstPage(setAccountType)} />
        {userType === "ADMIN" && <MultiSelect id="moderation-opco" label="OPCO" width={260} items={OPCO_OPTIONS} value={opco} onChange={withFirstPage(setOpco)} />}
      </Box>

      <LiveStatus message={isPageLoading ? `Chargement de la page ${currentPage} sur ${pageCount}…` : counter} />
      {counter && <Typography sx={{ mb: fr.spacing("3v"), color: "#666666" }}>{counter} :</Typography>}
      {isLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress />
        </Box>
      ) : isError ? (
        <Alert severity="error" small description="La file des offres à modérer n’a pas pu être chargée. Réessayez." />
      ) : jobs.length === 0 && !isPlaceholderData ? (
        <Box sx={{ py: 6, textAlign: "center", color: "text.secondary" }}>Aucune offre à modérer.</Box>
      ) : (
        <>
          {/* Tableau et pagination restent montés pendant le chargement : cf. OffresPartenairesList */}
          <Box aria-busy={isPageLoading} sx={{ opacity: isPageLoading ? 0.5 : 1, transition: "opacity .2s" }}>
            <VirtualTable
              caption={`Offres à modérer (${total} au total)`}
              columns={columns}
              data={jobs}
              hideSearch
              hideCount
              rowHeight={90}
              sorting={sorting}
              onSortingChange={(next) => {
                setOffset(0)
                setSorting(next.length ? next : DEFAULT_SORTING)
              }}
            />
          </Box>
          <Box
            component="nav"
            aria-label="Pagination des offres à modérer"
            sx={{ display: "flex", justifyContent: "center", alignItems: "center", gap: fr.spacing("3v"), mt: fr.spacing("4v") }}
          >
            <PaginationButton
              label="Précédent"
              targetPage={currentPage - 1}
              pageCount={pageCount}
              isAvailable={currentPage > 1}
              onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
            />
            <Typography sx={{ fontSize: ".875rem", color: "#666666" }}>{`Page ${currentPage} sur ${pageCount}`}</Typography>
            <PaginationButton
              label="Suivant"
              targetPage={currentPage + 1}
              pageCount={pageCount}
              isAvailable={currentPage < pageCount}
              onClick={() => setOffset(offset + PAGE_SIZE)}
            />
          </Box>
        </>
      )}
    </>
  )
}
