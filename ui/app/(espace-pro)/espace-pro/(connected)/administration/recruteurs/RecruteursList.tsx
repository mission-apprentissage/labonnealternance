"use client"
import { fr } from "@codegouvfr/react-dsfr"
import { Box, CircularProgress, Typography } from "@mui/material"
import { useQuery } from "@tanstack/react-query"
import { useMemo, useState } from "react"
import type { IUserRecruteurForAdminJSON, IUserRecruteurJson } from "shared"
import { CFA, ENTREPRISE, ETAT_UTILISATEUR, OPCOS_LABEL } from "shared/constants/recruteur"
import type { IUserRecruteur } from "shared/models/users-recruteur.model"
import { getUserStatus } from "shared/models/users-recruteur.model"
import { VirtualTable } from "@/app/(espace-pro)/_components/VirtualTable"
import { useDisclosure } from "@/app/hooks/use-disclosure"
import { ConfirmationDesactivationUtilisateur } from "@/components/espace_pro"
import ConfirmationActivationUtilisateur from "@/components/espace_pro/ConfirmationActivationUtilisateur"
import { apiGet } from "@/utils/api.utils"
import { AdminSearchInput } from "../_components/AdminSearchInput"
import { MultiSelect } from "../_components/MultiSelect"
import { getRecruteursColumns } from "../_utils/recruteursColumns"
import { statusLabels } from "../users/UsersList"

const accountTypes = [CFA, ENTREPRISE] as const
const opcoValues = [...Object.values(OPCOS_LABEL)] as const
const allStatuses = [...Object.values(ETAT_UTILISATEUR)] as const

type AccountTypeValue = (typeof accountTypes)[number]
type OpcoValue = (typeof opcoValues)[number]

export function RecruteursList() {
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
    retry: false,
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
      onSearch={setSubmittedSearch}
      onReset={() => {
        setSubmittedSearch("")
        setSelectedStatuses([...allStatuses])
        setSelectedAccountTypes([...accountTypes])
        setSelectedOpcos([...opcoValues])
      }}
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
  onSearch,
  onReset,
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
  onSearch: (search: string) => void
  onReset: () => void
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
      <Box sx={{ mb: fr.spacing("6v") }}>
        <AdminSearchInput label="Rechercher" placeholder="Raison sociale, email, téléphone..." onSearch={onSearch} onReset={onReset} />
      </Box>

      {/* Ligne 2 : filtres */}
      <Box sx={{ display: "flex", flexWrap: "wrap", columnGap: fr.spacing("4v"), "& > .MuiFormControl-root": { mb: fr.spacing("6v") } }}>
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
        <Box component="p" sx={{ py: 6, m: 0, textAlign: "center", color: "text.secondary" }}>
          Lancez une recherche pour afficher les recruteurs.
        </Box>
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
