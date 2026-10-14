"use client"
import { fr } from "@codegouvfr/react-dsfr"
import Alert from "@codegouvfr/react-dsfr/Alert"
import Button from "@codegouvfr/react-dsfr/Button"
import { Box, CircularProgress, Typography } from "@mui/material"
import { keepPreviousData, useQuery } from "@tanstack/react-query"
import type { CSSProperties } from "react"
import { useMemo, useState } from "react"
import type { IJobsPartnersOfferForAdminJSON } from "shared/models/jobs-partners.model"
import { JOBPARTNERS_LABEL, jobPartnersExcludedFromFlux } from "shared/models/jobs-partners.model"

import { VirtualTable } from "@/app/(espace-pro)/_components/VirtualTable"
import { useDisclosure } from "@/app/hooks/use-disclosure"
import { getJobsPartnersForAdmin } from "@/utils/api"
import { AdminSearchInput } from "../_components/AdminSearchInput"
import { MultiSelect } from "../_components/MultiSelect"
import { OFFER_ID_EXAMPLE, validateOfferId } from "../_utils/admin-search-validation"
import { getOffresPartenairesColumns } from "../_utils/offresPartenairesColumns"
import { ConfirmationClassificationOffre, ConfirmationDesactivationOffre } from "./OffresPartenairesModals"

const partnerLabelOptions = Object.values(JOBPARTNERS_LABEL).filter((label) => !jobPartnersExcludedFromFlux.includes(label))

const PAGE_SIZE = 50

// aria-disabled plutôt que disabled : un bouton désactivé perd le focus, qui retombe en haut de page. Le DSFR ne stylant que :disabled, l'apparence est reproduite ici
function PaginationButton({
  label,
  targetPage,
  pageCount,
  isAvailable,
  onClick,
}: {
  label: string
  targetPage: number
  pageCount: number
  isAvailable: boolean
  onClick: () => void
}) {
  return (
    <Button
      priority="secondary"
      onClick={() => {
        if (isAvailable) onClick()
      }}
      nativeButtonProps={{
        "aria-disabled": !isAvailable,
        "aria-label": isAvailable ? `${label}, page ${targetPage} sur ${pageCount}` : undefined,
      }}
      style={
        isAvailable
          ? undefined
          : ({
              color: "var(--text-disabled-grey)",
              boxShadow: "inset 0 0 0 1px var(--border-disabled-grey)",
              backgroundColor: "transparent",
              cursor: "not-allowed",
              "--hover": "inherit",
              "--active": "inherit",
            } as CSSProperties)
      }
    >
      {label}
    </Button>
  )
}

export function OffresPartenairesList() {
  const [selectedPartnerLabels, setSelectedPartnerLabels] = useState<string[]>([])
  const [submittedId, setSubmittedId] = useState("")
  const [offset, setOffset] = useState(0)

  const { data, isLoading, isError, isPlaceholderData, isFetching } = useQuery({
    queryKey: ["/admin/jobs-partners", selectedPartnerLabels, submittedId, offset],
    queryFn: () =>
      getJobsPartnersForAdmin({
        partner_label: selectedPartnerLabels.length ? selectedPartnerLabels : undefined,
        id: submittedId || undefined,
        limit: PAGE_SIZE,
        offset,
      }),
    staleTime: 1000 * 30,
    placeholderData: keepPreviousData,
    retry: false,
  })

  const jobs = useMemo(() => data?.jobs ?? [], [data])
  const total = data?.pagination.total ?? 0
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const currentPage = Math.floor(offset / PAGE_SIZE) + 1
  const isPageLoading = isFetching && isPlaceholderData

  const [currentOffer, setCurrentOffer] = useState<IJobsPartnersOfferForAdminJSON | null>(null)
  const confirmationDesactivationOffre = useDisclosure()
  const confirmationClassificationOffre = useDisclosure()

  const columns = useMemo(
    () => getOffresPartenairesColumns({ setCurrentOffer, confirmationDesactivationOffre, confirmationClassificationOffre }),
    [confirmationDesactivationOffre, confirmationClassificationOffre]
  )

  const onSearch = (search: string) => {
    setOffset(0)
    setSubmittedId(search)
  }

  const onReset = () => {
    setSelectedPartnerLabels([])
    onSearch("")
  }

  return (
    <>
      <ConfirmationDesactivationOffre offer={currentOffer} isOpen={confirmationDesactivationOffre.isOpen} onClose={confirmationDesactivationOffre.onClose} />
      <ConfirmationClassificationOffre offer={currentOffer} isOpen={confirmationClassificationOffre.isOpen} onClose={confirmationClassificationOffre.onClose} />

      {/* Ligne 1 : recherche par id */}
      <Box sx={{ mb: fr.spacing("6v") }}>
        <AdminSearchInput
          label="Rechercher par identifiant (_id)"
          placeholder="Identifiant de l'offre..."
          onSearch={onSearch}
          onReset={onReset}
          validate={validateOfferId}
          hintText={`24 caractères hexadécimaux (chiffres 0 à 9, lettres a à f), par exemple ${OFFER_ID_EXAMPLE}`}
          inputWidth="420px"
        />
      </Box>

      {/* Ligne 2 : filtres */}
      <Box sx={{ display: "flex", flexWrap: "wrap", columnGap: fr.spacing("4v"), "& > .MuiFormControl-root": { mb: fr.spacing("6v") } }}>
        <MultiSelect
          id="partner-label-offres-partenaires"
          label="Partenaire"
          width={260}
          items={partnerLabelOptions.map((label) => ({ value: label, label }))}
          value={selectedPartnerLabels}
          onChange={(v) => {
            setOffset(0)
            setSelectedPartnerLabels(v)
          }}
        />
      </Box>

      {isLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress />
        </Box>
      ) : isError ? (
        <Alert severity="error" small description="La recherche des offres a échoué. Réessayez." />
      ) : jobs.length === 0 && !isPlaceholderData ? (
        <Box sx={{ py: 6, textAlign: "center", color: "text.secondary" }}>Aucun résultat.</Box>
      ) : (
        <>
          {/* Tableau et pagination restent montés pendant le chargement : les démonter ferait perdre le focus du bouton cliqué */}
          <Box aria-busy={isPageLoading} sx={{ opacity: isPageLoading ? 0.5 : 1, transition: "opacity .2s" }}>
            <VirtualTable caption={`Offres partenaires (${total} au total)`} columns={columns} data={jobs} hideSearch={true} />
          </Box>
          <Box
            component="nav"
            aria-label="Pagination des offres partenaires"
            sx={{ display: "flex", justifyContent: "center", alignItems: "center", gap: fr.spacing("3v"), mt: fr.spacing("4v") }}
          >
            <PaginationButton
              label="Précédent"
              targetPage={currentPage - 1}
              pageCount={pageCount}
              isAvailable={currentPage > 1}
              onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
            />
            <Typography role="status" sx={{ fontSize: ".875rem", color: "#666666" }}>
              {isPageLoading ? `Chargement de la page ${currentPage} sur ${pageCount}…` : `Page ${currentPage} sur ${pageCount}`}
            </Typography>
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
