"use client"
import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import Input from "@codegouvfr/react-dsfr/Input"
import { Box, Checkbox, CircularProgress, FormControl, InputLabel, ListItemText, MenuItem, OutlinedInput, Select, Typography } from "@mui/material"
import { useQuery } from "@tanstack/react-query"
import { useMemo, useState } from "react"
import type { IUserRecruteurForAdminJSON, IUserRecruteurJson } from "shared"
import { CFA, ENTREPRISE, ETAT_UTILISATEUR, OPCOS_LABEL } from "shared/constants/recruteur"
import type { IUserRecruteur } from "shared/models/usersRecruteur.model"
import { getUserStatus } from "shared/models/usersRecruteur.model"
import { VirtualTable } from "@/app/(espace-pro)/_components/VirtualTable"
import { useDisclosure } from "@/common/hooks/useDisclosure"
import { ConfirmationDesactivationUtilisateur } from "@/components/espace_pro"
import ConfirmationActivationUtilisateur from "@/components/espace_pro/ConfirmationActivationUtilisateur"
import { apiGet } from "@/utils/api.utils"
import { getRecruteursColumns } from "../_utils/recruteursColumns"
import { statusLabels } from "../users/UsersList"

const accountTypes = [CFA, ENTREPRISE] as const
const opcoValues = [...Object.values(OPCOS_LABEL)] as const
const allStatuses = [...Object.values(ETAT_UTILISATEUR)] as const

type AccountTypeValue = (typeof accountTypes)[number]
type OpcoValue = (typeof opcoValues)[number]

export function RecruteursList() {
  const [searchInput, setSearchInput] = useState("")
  const [submittedSearch, setSubmittedSearch] = useState("")
  const [selectedStatuses, setSelectedStatuses] = useState<ETAT_UTILISATEUR[]>([...allStatuses])
  const [selectedAccountTypes, setSelectedAccountTypes] = useState<AccountTypeValue[]>([...accountTypes])
  const [selectedOpcos, setSelectedOpcos] = useState<OpcoValue[]>([...opcoValues])

  const isEnabled = submittedSearch.length >= 2

  const {
    data: dataRaw,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["/admin/users-recruteurs", "gestion", submittedSearch],
    queryFn: () =>
      apiGet("/admin/users-recruteurs", {
        querystring: {
          ...(submittedSearch ? { search: submittedSearch } : {}),
        },
      }),
    enabled: isEnabled,
    staleTime: 1000 * 60 * 5,
  })

  const allUsers = useMemo(() => (dataRaw as IUserRecruteurForAdminJSON[]) ?? [], [dataRaw])

  const filteredUsers = useMemo(() => {
    let users = allUsers
    users = users.filter((u) => selectedStatuses.includes(getUserStatus(u.status as unknown as IUserRecruteur["status"]) as ETAT_UTILISATEUR))
    users = users.filter(({ type }) => selectedAccountTypes.includes(type as AccountTypeValue))
    const isOpcoDisabled = selectedAccountTypes.length > 0 && selectedAccountTypes.length < accountTypes.length && !selectedAccountTypes.includes(ENTREPRISE)
    if (!isOpcoDisabled) {
      users = users.filter((u) => selectedOpcos.includes(u.opco as OpcoValue))
    }
    return users
  }, [allUsers, selectedStatuses, selectedAccountTypes, selectedOpcos])

  const opcoDisabled = selectedAccountTypes.length > 0 && selectedAccountTypes.length < accountTypes.length && !selectedAccountTypes.includes(ENTREPRISE)

  return (
    <RecruteursContent
      userRecruteurs={filteredUsers}
      onInvalidateData={() => refetch()}
      selectedStatuses={selectedStatuses}
      onSelectedStatusesChange={setSelectedStatuses}
      selectedAccountTypes={selectedAccountTypes}
      onSelectedAccountTypesChange={setSelectedAccountTypes}
      selectedOpcos={selectedOpcos}
      onSelectedOpcosChange={setSelectedOpcos}
      opcoDisabled={opcoDisabled}
      searchInput={searchInput}
      onSearchInputChange={setSearchInput}
      onSearch={() => setSubmittedSearch(searchInput)}
      isEnabled={isEnabled}
      isFetching={isFetching}
    />
  )
}

function RecruteursContent({
  userRecruteurs,
  onInvalidateData,
  selectedStatuses,
  onSelectedStatusesChange,
  selectedAccountTypes,
  onSelectedAccountTypesChange,
  selectedOpcos,
  onSelectedOpcosChange,
  opcoDisabled,
  searchInput,
  onSearchInputChange,
  onSearch,
  isEnabled,
  isFetching,
}: {
  userRecruteurs: IUserRecruteurJson[]
  onInvalidateData: () => void
  selectedStatuses: ETAT_UTILISATEUR[]
  onSelectedStatusesChange: (v: ETAT_UTILISATEUR[]) => void
  selectedAccountTypes: AccountTypeValue[]
  onSelectedAccountTypesChange: (v: AccountTypeValue[]) => void
  selectedOpcos: OpcoValue[]
  onSelectedOpcosChange: (v: OpcoValue[]) => void
  opcoDisabled: boolean
  searchInput: string
  onSearchInputChange: (v: string) => void
  onSearch: () => void
  isEnabled: boolean
  isFetching: boolean
}) {
  const [currentEntreprise, setCurrentEntreprise] = useState<IUserRecruteurForAdminJSON | null>(null)
  const confirmationDesactivationUtilisateur = useDisclosure()
  const confirmationActivationUtilisateur = useDisclosure()

  const columns = getRecruteursColumns({ setCurrentEntreprise, confirmationActivationUtilisateur, confirmationDesactivationUtilisateur })

  return (
    <>
      <ConfirmationDesactivationUtilisateur {...confirmationDesactivationUtilisateur} userRecruteur={currentEntreprise} onUpdate={onInvalidateData} />
      <ConfirmationActivationUtilisateur
        onClose={confirmationActivationUtilisateur.onClose}
        isOpen={confirmationActivationUtilisateur.isOpen}
        _id={currentEntreprise?._id ?? ""}
        organizationId={currentEntreprise?.organizationId ?? ""}
        establishment_raison_sociale={currentEntreprise?.establishment_raison_sociale}
        onConfirmation={onInvalidateData}
      />

      {/* Ligne 1 : recherche */}
      <Box sx={{ display: "flex", gap: fr.spacing("2v"), alignItems: "flex-end", mb: fr.spacing("3v") }}>
        <Input
          label="Rechercher"
          nativeInputProps={{
            value: searchInput,
            placeholder: "Raison sociale, email, téléphone...",
            onChange: (e) => onSearchInputChange(e.target.value),
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
          id="status-gestion"
          label="Statut"
          width={260}
          items={allStatuses.map((s) => ({ value: s, label: statusLabels[s] }))}
          value={selectedStatuses}
          onChange={onSelectedStatusesChange}
        />
        <MultiSelect
          id="account-type-gestion"
          label="Type de compte"
          width={200}
          items={accountTypes.map((t) => ({ value: t, label: t }))}
          value={selectedAccountTypes}
          onChange={onSelectedAccountTypesChange}
        />
        <MultiSelect
          id="opco-gestion"
          label="OPCO"
          width={220}
          items={opcoValues.map((o) => ({ value: o, label: o }))}
          value={selectedOpcos}
          onChange={onSelectedOpcosChange}
          disabled={opcoDisabled}
        />
      </Box>

      {!isEnabled ? (
        <Box sx={{ py: 6, textAlign: "center", color: "text.secondary" }}>Saisissez au moins 2 caractères pour rechercher.</Box>
      ) : isFetching ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress />
        </Box>
      ) : (
        <VirtualTable
          caption={`Gestion des recruteurs (${userRecruteurs.length})`}
          columns={columns}
          data={userRecruteurs}
          defaultSortBy={[{ id: "createdAt", desc: true }]}
          hideSearch={true}
        />
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
  disabled = false,
}: {
  id: string
  label: string
  width: number
  items: { value: T; label: string }[]
  value: T[]
  onChange: (newValue: T[]) => void
  disabled?: boolean
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
    <FormControl sx={{ width }} size="small" disabled={disabled}>
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
