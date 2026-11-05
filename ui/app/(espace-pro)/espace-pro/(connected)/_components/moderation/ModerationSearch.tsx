"use client"

import { fr } from "@codegouvfr/react-dsfr"
import Alert from "@codegouvfr/react-dsfr/Alert"
import { Box, CircularProgress, Typography } from "@mui/material"
import { keepPreviousData, useQuery } from "@tanstack/react-query"
import type { SortingState } from "@tanstack/react-table"
import { useMemo, useState } from "react"
import { LBA_ITEM_TYPE } from "shared/constants/lbaitem"
import { buildJobUrlPath } from "shared/metier/lbaitemutils"
import { JOB_STATUS_ENGLISH } from "shared/models/job.model"
import { AccessStatus } from "shared/models/role-management.model"
import type { IModerationAccountType, IModerationSearchAccountStatus, IModerationSearchConformity } from "shared/routes/jobs-partners-moderation.routes"
import { LiveStatus } from "@/app/_components/LiveStatus"
import type { PopoverMenuAction } from "@/app/(espace-pro)/_components/PopoverMenu"
import { PopoverMenu } from "@/app/(espace-pro)/_components/PopoverMenu"
import { AdminSearchInput } from "@/app/(espace-pro)/espace-pro/(connected)/administration/_components/AdminSearchInput"
import { MultiSelect } from "@/app/(espace-pro)/espace-pro/(connected)/administration/_components/MultiSelect"
import { MIN_SEARCH_LENGTH } from "@/app/(espace-pro)/espace-pro/(connected)/administration/_utils/admin-search-validation"
import { DsfrIcon } from "@/components/DsfrIcon"
import { publicConfig } from "@/config.public"
import { searchModerationOffers } from "@/utils/api"
import { MODERATION_PAGES } from "@/utils/moderation-pages.utils"
import { pluralize } from "@/utils/strutils"
import { getModerationColumns, getModerationPagination, MODERATION_DEFAULT_SORTING, MODERATION_PAGE_SIZE, ModerationOffersResults, toModerationSort } from "./ModerationOffersTable"
import type { IModerationQueueItemJson } from "./moderation.types"
import { getOfferEditionPath, getRecruiterAccountPath } from "./moderation-links"

const TITLE = "Résultats de la recherche"

const ACCOUNT_STATUS_OPTIONS: { value: IModerationSearchAccountStatus; label: string }[] = [
  { value: AccessStatus.AWAITING_VALIDATION, label: "En attente" },
  { value: AccessStatus.GRANTED, label: "Actif" },
  { value: AccessStatus.DENIED, label: "Désactivé" },
]
const ACCOUNT_TYPE_OPTIONS: { value: IModerationAccountType; label: string }[] = [
  { value: "ENTREPRISE", label: "Entreprise" },
  { value: "CFA", label: "CFA" },
]
// Regroupés comme les badges de statut (cf. OfferStatusBadge) : « En attente » couvre l'attente du compte et la modération.
const OFFER_STATUS_GROUPS = {
  en_attente: [JOB_STATUS_ENGLISH.EN_ATTENTE, JOB_STATUS_ENGLISH.EN_MODERATION],
  publiee: [JOB_STATUS_ENGLISH.ACTIVE],
  pourvue: [JOB_STATUS_ENGLISH.POURVUE],
  expiree: [JOB_STATUS_ENGLISH.ANNULEE],
} as const
type IOfferStatusGroup = keyof typeof OFFER_STATUS_GROUPS
const OFFER_STATUS_OPTIONS: { value: IOfferStatusGroup; label: string }[] = [
  { value: "en_attente", label: "En attente" },
  { value: "publiee", label: "Publiée" },
  { value: "pourvue", label: "Pourvue" },
  { value: "expiree", label: "Expirée" },
]
const CONFORMITY_OPTIONS: { value: IModerationSearchConformity; label: string }[] = [
  { value: "non_conforme", label: "Non conforme" },
  { value: "a_verifier", label: "À vérifier" },
  { value: "indisponible", label: "Analyse indisponible" },
  { value: "conforme", label: "Conforme" },
  { value: "non_applicable", label: "Non applicable" },
]

const CLOSED_STATUSES: JOB_STATUS_ENGLISH[] = [JOB_STATUS_ENGLISH.ANNULEE, JOB_STATUS_ENGLISH.POURVUE]

/**
 * Actions de la maquette selon le statut de l'offre (#5757) : une offre close, expirée, supprimée, refusée ou pourvue,
 * ne se consulte plus que depuis la modération ; seule une offre publiée a une page publique.
 */
export const ModerationSearchMenu = ({ row }: { row: IModerationQueueItemJson }) => {
  const moderationPath = MODERATION_PAGES.offre({ job_id: row._id, userType: "ADMIN" }).getPath()
  const moderationIcon = <DsfrIcon name="fr-icon-scales-3-line" size={16} />
  if (CLOSED_STATUSES.includes(row.offer_status)) {
    const actions: PopoverMenuAction[] = [{ label: "Voir la modération", hint: row.offer_title, link: moderationPath, type: "link", icon: moderationIcon }]
    return <PopoverMenu actions={actions} title={`Actions sur l’offre ${row.offer_title}`} />
  }
  const editionPath = getOfferEditionPath(row, row.recruiter, "ADMIN")
  const accountPath = getRecruiterAccountPath(row.recruiter, "ADMIN")
  const actions: PopoverMenuAction[] = [
    { label: "Modérer l’offre", hint: row.offer_title, link: moderationPath, type: "link", icon: moderationIcon },
    editionPath ? { label: "Éditer l’offre", hint: row.offer_title, link: editionPath, type: "link", icon: <DsfrIcon name="fr-icon-edit-line" size={16} /> } : null,
    row.offer_status === JOB_STATUS_ENGLISH.ACTIVE
      ? {
          label: "Voir l’offre en ligne",
          hint: row.offer_title,
          link: `${publicConfig.baseUrl}${buildJobUrlPath(LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA, row._id, row.offer_rome_appellation || undefined)}`,
          type: "externalLink",
          icon: <DsfrIcon name="fr-icon-eye-line" size={16} />,
        }
      : null,
    accountPath
      ? {
          label: "Voir le compte recruteur",
          hint: row.recruiter.raison_sociale ?? undefined,
          link: accountPath,
          type: "link",
          icon: <DsfrIcon name="fr-icon-user-line" size={16} />,
        }
      : null,
  ]
  return <PopoverMenu actions={actions} title={`Actions sur l’offre ${row.offer_title}`} />
}

/** Recherche d'un administrateur sur toutes les offres LBA, quel que soit leur statut (#5757). */
export function ModerationSearch() {
  const [search, setSearch] = useState("")
  const [accountStatus, setAccountStatus] = useState<IModerationSearchAccountStatus[]>([])
  const [accountType, setAccountType] = useState<IModerationAccountType[]>([])
  const [offerStatus, setOfferStatus] = useState<IOfferStatusGroup[]>([])
  const [conformity, setConformity] = useState<IModerationSearchConformity[]>([])
  const [sorting, setSorting] = useState<SortingState>(MODERATION_DEFAULT_SORTING)
  const [offset, setOffset] = useState(0)

  const { sort, order } = toModerationSort(sorting)
  const hasSearch = search.length >= MIN_SEARCH_LENGTH

  const { data, isLoading, isError, isPlaceholderData, isFetching } = useQuery({
    queryKey: ["moderation-search", search, accountStatus, accountType, offerStatus, conformity, sort, order, offset],
    queryFn: () =>
      searchModerationOffers({
        search,
        account_status: accountStatus.length ? accountStatus : undefined,
        account_type: accountType.length ? accountType : undefined,
        offer_status: offerStatus.length ? offerStatus.flatMap((group) => OFFER_STATUS_GROUPS[group]) : undefined,
        conformity: conformity.length ? conformity : undefined,
        sort,
        order,
        limit: MODERATION_PAGE_SIZE,
        offset,
      }),
    enabled: hasSearch,
    placeholderData: keepPreviousData,
    retry: false,
  })

  const jobs = data?.jobs ?? []
  const total = data?.pagination.total ?? 0
  const { pageCount, currentPage } = getModerationPagination(total, offset)
  const isPageLoading = isFetching && isPlaceholderData
  const columns = useMemo(() => getModerationColumns("ADMIN", (row) => <ModerationSearchMenu row={row} />), [])

  const withFirstPage =
    <T,>(setter: (value: T) => void) =>
    (value: T) => {
      setOffset(0)
      setter(value)
    }

  const counter = !hasSearch || isLoading || isError ? "" : pluralize(total, "résultat")

  return (
    <>
      <Box sx={{ mb: fr.spacing("6v") }}>
        <AdminSearchInput
          label="Rechercher une offre"
          placeholder="Raison sociale, SIRET, e-mail, identifiant"
          hintText={`Raison sociale, SIRET, e-mail du recruteur ou identifiant de l’offre, au moins ${MIN_SEARCH_LENGTH} caractères`}
          onSearch={withFirstPage(setSearch)}
          onReset={() => withFirstPage(setSearch)("")}
          inputWidth="420px"
        />
      </Box>
      <Box sx={{ display: "flex", flexWrap: "wrap", columnGap: fr.spacing("4v"), "& > .MuiFormControl-root": { mb: fr.spacing("6v") } }}>
        <MultiSelect
          id="recherche-statut-compte"
          label="Statut du compte recruteur"
          width={230}
          items={ACCOUNT_STATUS_OPTIONS}
          value={accountStatus}
          onChange={withFirstPage(setAccountStatus)}
        />
        <MultiSelect id="recherche-type-compte" label="Type de compte" width={200} items={ACCOUNT_TYPE_OPTIONS} value={accountType} onChange={withFirstPage(setAccountType)} />
        <MultiSelect id="recherche-statut-offre" label="Statut de l’offre" width={200} items={OFFER_STATUS_OPTIONS} value={offerStatus} onChange={withFirstPage(setOfferStatus)} />
        <MultiSelect id="recherche-conformite" label="Niveau de conformité" width={230} items={CONFORMITY_OPTIONS} value={conformity} onChange={withFirstPage(setConformity)} />
      </Box>

      <LiveStatus message={isPageLoading ? `Chargement de la page ${currentPage} sur ${pageCount}…` : counter} />
      {!hasSearch ? (
        <Typography sx={{ py: 6, textAlign: "center" }}>{`Saisissez au moins ${MIN_SEARCH_LENGTH} caractères pour rechercher.`}</Typography>
      ) : isLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress />
        </Box>
      ) : isError ? (
        <Alert severity="error" small description="La recherche n’a pas abouti. Réessayez." />
      ) : jobs.length === 0 && !isPlaceholderData ? (
        <Box sx={{ py: 6, textAlign: "center", color: "text.secondary" }}>Aucune offre ne correspond à cette recherche.</Box>
      ) : (
        <>
          <Typography sx={{ mb: fr.spacing("3v"), color: "#666666" }}>{counter} :</Typography>
          <ModerationOffersResults
            title={TITLE}
            columns={columns}
            jobs={jobs}
            total={total}
            offset={offset}
            onOffsetChange={setOffset}
            sorting={sorting}
            onSortingChange={setSorting}
            isPageLoading={isPageLoading}
          />
        </>
      )}
    </>
  )
}
