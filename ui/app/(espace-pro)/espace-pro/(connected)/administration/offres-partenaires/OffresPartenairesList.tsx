"use client"
import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import Input from "@codegouvfr/react-dsfr/Input"
import { Box, Checkbox, CircularProgress, FormControl, InputLabel, ListItemText, MenuItem, OutlinedInput, Select, Typography } from "@mui/material"
import { useQuery } from "@tanstack/react-query"
import { useMemo, useState } from "react"
import type { IJobsPartnersOfferForAdminJSON } from "shared/models/jobs-partners.model"
import { JOBPARTNERS_LABEL, jobPartnersExcludedFromFlux } from "shared/models/jobs-partners.model"

import { VirtualTable } from "@/app/(espace-pro)/_components/VirtualTable"
import { useDisclosure } from "@/app/hooks/use-disclosure"
import { getJobsPartnersForAdmin } from "@/utils/api"
import { getOffresPartenairesColumns } from "../_utils/offresPartenairesColumns"
import { ConfirmationClassificationOffre, ConfirmationDesactivationOffre } from "./OffresPartenairesModals"

const partnerLabelOptions = Object.values(JOBPARTNERS_LABEL).filter((label) => !jobPartnersExcludedFromFlux.includes(label))

const PAGE_SIZE = 50

export function OffresPartenairesList() {
  const [selectedPartnerLabels, setSelectedPartnerLabels] = useState<string[]>([])
  const [idInput, setIdInput] = useState("")
  const [submittedId, setSubmittedId] = useState("")
  const [offset, setOffset] = useState(0)

  const { data, isFetching } = useQuery({
    queryKey: ["/admin/jobs-partners", selectedPartnerLabels, submittedId, offset],
    queryFn: () =>
      getJobsPartnersForAdmin({
        partner_label: selectedPartnerLabels.length ? selectedPartnerLabels : undefined,
        id: submittedId || undefined,
        limit: PAGE_SIZE,
        offset,
      }),
    staleTime: 1000 * 30,
  })

  const jobs = useMemo(() => data?.jobs ?? [], [data])
  const total = data?.pagination.total ?? 0
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const currentPage = Math.floor(offset / PAGE_SIZE) + 1

  const [currentOffer, setCurrentOffer] = useState<IJobsPartnersOfferForAdminJSON | null>(null)
  const confirmationDesactivationOffre = useDisclosure()
  const confirmationClassificationOffre = useDisclosure()

  const columns = useMemo(
    () => getOffresPartenairesColumns({ setCurrentOffer, confirmationDesactivationOffre, confirmationClassificationOffre }),
    [confirmationDesactivationOffre, confirmationClassificationOffre]
  )

  const onSearch = () => {
    setOffset(0)
    setSubmittedId(idInput.trim())
  }

  return (
    <>
      <ConfirmationDesactivationOffre offer={currentOffer} isOpen={confirmationDesactivationOffre.isOpen} onClose={confirmationDesactivationOffre.onClose} />
      <ConfirmationClassificationOffre offer={currentOffer} isOpen={confirmationClassificationOffre.isOpen} onClose={confirmationClassificationOffre.onClose} />

      {/* Ligne 1 : recherche par id */}
      <Box sx={{ display: "flex", gap: fr.spacing("2v"), alignItems: "flex-end", mb: fr.spacing("3v") }}>
        <Input
          label="Rechercher par identifiant (_id)"
          nativeInputProps={{
            value: idInput,
            placeholder: "Identifiant de l'offre...",
            onChange: (e) => setIdInput(e.target.value),
            onKeyDown: (e) => {
              if (e.key === "Enter") onSearch()
            },
            style: { minWidth: "360px" },
          }}
        />
        <Button iconId="fr-icon-search-line" priority="primary" onClick={onSearch} style={{ marginBottom: "1.5rem" }}>
          Rechercher
        </Button>
      </Box>

      {/* Ligne 2 : filtres */}
      <Box sx={{ display: "flex", gap: fr.spacing("4v"), mb: fr.spacing("4v"), alignItems: "center" }}>
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

      {isFetching ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress />
        </Box>
      ) : jobs.length === 0 ? (
        <Box sx={{ py: 6, textAlign: "center", color: "text.secondary" }}>Aucun résultat.</Box>
      ) : (
        <>
          <VirtualTable caption={`Offres partenaires (${total} au total)`} columns={columns} data={jobs} hideSearch={true} />
          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", gap: fr.spacing("3v"), mt: fr.spacing("4v") }}>
            <Button priority="secondary" disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}>
              Précédent
            </Button>
            <Typography sx={{ fontSize: ".875rem", color: "#666666" }}>
              Page {currentPage} / {pageCount}
            </Typography>
            <Button priority="secondary" disabled={currentPage >= pageCount} onClick={() => setOffset(offset + PAGE_SIZE)}>
              Suivant
            </Button>
          </Box>
        </>
      )}
    </>
  )
}

function MultiSelect<T extends string>({
  id,
  label,
  width,
  items,
  value,
  onChange,
}: {
  id: string
  label: string
  width: number
  items: { value: T; label: string }[]
  value: T[]
  onChange: (newValue: T[]) => void
}) {
  const allSelected = value.length === items.length
  const someSelected = value.length > 0 && !allSelected

  function handleChange(selected: string[]) {
    if (selected.includes("__all__")) {
      onChange(allSelected ? [] : items.map((i) => i.value))
    } else {
      onChange(selected as T[])
    }
  }

  const displayLabel = value.length === 0 ? "Tous" : value.map((v) => items.find((i) => i.value === v)?.label ?? v).join(", ")

  return (
    <FormControl sx={{ width }} size="small">
      <InputLabel id={`${id}-label`} sx={{ fontSize: ".875rem" }}>
        {label}
      </InputLabel>
      <Select
        labelId={`${id}-label`}
        multiple
        value={value}
        onChange={(e) => handleChange(e.target.value as string[])}
        input={<OutlinedInput label={label} />}
        renderValue={() => displayLabel}
        MenuProps={{ PaperProps: { style: { maxHeight: 300 } } }}
      >
        <MenuItem value="__all__" sx={{ borderBottom: "1px solid", borderColor: "divider" }}>
          <Checkbox checked={allSelected} indeterminate={someSelected} size="small" />
          <ListItemText primary={allSelected ? "Tout désélectionner" : "Tout sélectionner"} slotProps={{ primary: { fontSize: ".875rem" } }} />
        </MenuItem>
        {items.map((item) => (
          <MenuItem key={item.value} value={item.value}>
            <Checkbox checked={value.includes(item.value)} size="small" />
            <ListItemText primary={item.label} slotProps={{ primary: { fontSize: ".875rem" } }} />
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  )
}
