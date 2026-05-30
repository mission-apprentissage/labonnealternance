"use client"
import { fr } from "@codegouvfr/react-dsfr"
import Button from "@codegouvfr/react-dsfr/Button"
import Input from "@codegouvfr/react-dsfr/Input"
import { Box, Checkbox, FormControl, InputLabel, ListItemText, MenuItem, OutlinedInput, Select, Stack, Typography } from "@mui/material"
import { useQuery } from "@tanstack/react-query"
import { useEffect, useMemo, useState } from "react"
import type { IUserRecruteurForAdminJSON, IUserRecruteurJson } from "shared"
import { CFA, ENTREPRISE, ETAT_UTILISATEUR, OPCOS_LABEL } from "shared/constants/recruteur"
import type { IUserRecruteur } from "shared/models/usersRecruteur.model"
import { getUserStatus } from "shared/models/usersRecruteur.model"
import LoadingEmptySpace from "@/app/(espace-pro)/_components/LoadingEmptySpace"
import { VirtualTable } from "@/app/(espace-pro)/_components/VirtualTable"
import { useToast } from "@/app/hooks/useToast"
import { useDisclosure } from "@/common/hooks/useDisclosure"
import { ConfirmationDesactivationUtilisateur } from "@/components/espace_pro"
import ConfirmationActivationUtilisateur from "@/components/espace_pro/ConfirmationActivationUtilisateur"
import { apiGet } from "@/utils/api.utils"
import { PAGES } from "@/utils/routes.utils"
import { useSearchParamsRecord } from "@/utils/useSearchParamsRecord"
import { getRecruteursColumns } from "../_utils/recruteursColumns"

const accountTypes = [CFA, ENTREPRISE] as const
const opcoValues = [...Object.values(OPCOS_LABEL)] as const
const routeBuilder = PAGES.dynamic.backAdminRecruteursATraiter

type AccountTypeValue = (typeof accountTypes)[number]
type OpcoValue = (typeof opcoValues)[number]
type RouteParams = { newUser?: string } & Partial<Parameters<typeof routeBuilder>[0]>

export const statusLabels = {
  [ETAT_UTILISATEUR.ATTENTE]: "En attente de vérification",
  [ETAT_UTILISATEUR.VALIDE]: "Actifs",
  [ETAT_UTILISATEUR.DESACTIVE]: "Désactivés",
  [ETAT_UTILISATEUR.ERROR]: "En erreur",
}

export const statusTagColor: Record<ETAT_UTILISATEUR, "green" | "yellow" | "red" | "pink"> = {
  [ETAT_UTILISATEUR.VALIDE]: "green",
  [ETAT_UTILISATEUR.ATTENTE]: "yellow",
  [ETAT_UTILISATEUR.DESACTIVE]: "red",
  [ETAT_UTILISATEUR.ERROR]: "pink",
}

const TRAITABLE_STATUSES = [ETAT_UTILISATEUR.ATTENTE, ETAT_UTILISATEUR.ERROR] as const

export function UsersList() {
  const routeParamsRaw = useSearchParamsRecord() as RouteParams
  const { newUser } = routeParamsRaw
  const toast = useToast()

  useEffect(() => {
    if (newUser) {
      toast({
        title: "Vérification réussie",
        description: "Votre adresse mail a été validée avec succès.",
        autoHideDuration: 7000,
      })
    }
  }, [newUser, toast])

  const attenteQuery = useQuery({
    queryKey: ["/admin/users-recruteurs", ETAT_UTILISATEUR.ATTENTE],
    queryFn: () => apiGet("/admin/users-recruteurs", { querystring: { status: ETAT_UTILISATEUR.ATTENTE } }),
    staleTime: 1000 * 60 * 20,
  })

  const errorQuery = useQuery({
    queryKey: ["/admin/users-recruteurs", ETAT_UTILISATEUR.ERROR],
    queryFn: () => apiGet("/admin/users-recruteurs", { querystring: { status: ETAT_UTILISATEUR.ERROR } }),
    staleTime: 1000 * 60 * 20,
  })

  const isLoading = attenteQuery.isLoading || errorQuery.isLoading
  const allUsers = useMemo(
    () => [...((attenteQuery.data as IUserRecruteurForAdminJSON[]) ?? []), ...((errorQuery.data as IUserRecruteurForAdminJSON[]) ?? [])],
    [attenteQuery.data, errorQuery.data]
  )

  const [searchInput, setSearchInput] = useState("")
  const [selectedStatuses, setSelectedStatuses] = useState<ETAT_UTILISATEUR[]>([ETAT_UTILISATEUR.ATTENTE, ETAT_UTILISATEUR.ERROR])
  const [selectedAccountTypes, setSelectedAccountTypes] = useState<AccountTypeValue[]>([...accountTypes])
  const [selectedOpcos, setSelectedOpcos] = useState<OpcoValue[]>([...opcoValues])

  const filteredUsers = useMemo(() => {
    let users = allUsers
    if (searchInput) {
      const q = searchInput.toLowerCase()
      users = users.filter((u) => [u.establishment_raison_sociale, u.email, u.first_name, u.last_name, u.phone, u.establishment_siret].some((v) => v?.toLowerCase().includes(q)))
    }
    users = users.filter((u) => selectedStatuses.includes(getUserStatus(u.status as unknown as IUserRecruteur["status"]) as ETAT_UTILISATEUR))
    users = users.filter(({ type }) => selectedAccountTypes.includes(type as AccountTypeValue))
    const isOpcoDisabled = selectedAccountTypes.length > 0 && !selectedAccountTypes.includes(ENTREPRISE)
    if (!isOpcoDisabled) {
      users = users.filter((u) => selectedOpcos.includes(u.opco as OpcoValue))
    }
    return users
  }, [allUsers, searchInput, selectedStatuses, selectedAccountTypes, selectedOpcos])

  if (isLoading) {
    return <LoadingEmptySpace />
  }

  const opcoDisabled = selectedAccountTypes.length > 0 && !selectedAccountTypes.includes(ENTREPRISE)

  function refetch() {
    attenteQuery.refetch()
    errorQuery.refetch()
  }

  return (
    <UserContent
      statusLabel={`Recruteurs à traiter (${filteredUsers.length})`}
      userRecruteurs={filteredUsers}
      onInvalidateData={refetch}
      searchInput={searchInput}
      onSearchInputChange={setSearchInput}
      selectedStatuses={selectedStatuses}
      onSelectedStatusesChange={setSelectedStatuses}
      selectedAccountTypes={selectedAccountTypes}
      onSelectedAccountTypesChange={setSelectedAccountTypes}
      selectedOpcos={selectedOpcos}
      onSelectedOpcosChange={setSelectedOpcos}
      opcoDisabled={opcoDisabled}
    />
  )
}

function UserContent({
  statusLabel,
  userRecruteurs,
  onInvalidateData,
  searchInput,
  onSearchInputChange,
  selectedStatuses,
  onSelectedStatusesChange,
  selectedAccountTypes,
  onSelectedAccountTypesChange,
  selectedOpcos,
  onSelectedOpcosChange,
  opcoDisabled,
}: {
  statusLabel: string
  userRecruteurs: IUserRecruteurJson[]
  onInvalidateData: () => void
  searchInput: string
  onSearchInputChange: (v: string) => void
  selectedStatuses: ETAT_UTILISATEUR[]
  onSelectedStatusesChange: (v: ETAT_UTILISATEUR[]) => void
  selectedAccountTypes: AccountTypeValue[]
  onSelectedAccountTypesChange: (v: AccountTypeValue[]) => void
  selectedOpcos: OpcoValue[]
  onSelectedOpcosChange: (v: OpcoValue[]) => void
  opcoDisabled: boolean
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
            style: { minWidth: "360px" },
          }}
        />
        <Button iconId="fr-icon-search-line" priority="primary" style={{ marginBottom: "1.5rem" }}>
          Rechercher
        </Button>
      </Box>

      {/* Ligne 2 : filtres */}
      <Box sx={{ display: "flex", gap: fr.spacing("4v"), mb: fr.spacing("4v"), alignItems: "center" }}>
        <MultiSelect
          id="status"
          label="Statut"
          width={260}
          items={TRAITABLE_STATUSES.map((s) => ({ value: s, label: statusLabels[s] }))}
          value={selectedStatuses}
          onChange={onSelectedStatusesChange}
        />
        <MultiSelect
          id="account-type"
          label="Type de compte"
          width={200}
          items={accountTypes.map((t) => ({ value: t, label: t }))}
          value={selectedAccountTypes}
          onChange={onSelectedAccountTypesChange}
        />
        <MultiSelect
          id="opco"
          label="OPCO"
          width={220}
          items={opcoValues.map((o) => ({ value: o, label: o }))}
          value={selectedOpcos}
          onChange={onSelectedOpcosChange}
          disabled={opcoDisabled}
        />
      </Box>
      <VirtualTable caption={statusLabel} columns={columns} data={userRecruteurs} defaultSortBy={[{ id: "createdAt", desc: false }]} hideSearch={true} />
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
