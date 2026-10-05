"use client"
import { fr } from "@codegouvfr/react-dsfr"
import { Box, Stack, Typography } from "@mui/material"
import { useQuery } from "@tanstack/react-query"
import { useEffect, useMemo, useState } from "react"
import type { IUserRecruteurForAdminJSON, IUserRecruteurJson } from "shared"
import { CFA, ENTREPRISE, ETAT_UTILISATEUR, OPCOS_LABEL } from "shared/constants/recruteur"
import type { IUserRecruteur } from "shared/models/users-recruteur.model"
import { getUserStatus } from "shared/models/users-recruteur.model"
import LoadingEmptySpace from "@/app/(espace-pro)/_components/LoadingEmptySpace"
import { VirtualTable } from "@/app/(espace-pro)/_components/VirtualTable"
import { useDisclosure } from "@/app/hooks/use-disclosure"
import { useToast } from "@/app/hooks/useToast"
import { ConfirmationDesactivationUtilisateur } from "@/components/espace_pro"
import ConfirmationActivationUtilisateur from "@/components/espace_pro/ConfirmationActivationUtilisateur"
import { apiGet } from "@/utils/api.utils"
import { PAGES } from "@/utils/routes.utils"
import { useSearchParamsRecord } from "@/utils/use-search-params-record"
import { AdminSearchInput } from "../_components/AdminSearchInput"
import { MultiSelect } from "../_components/MultiSelect"
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

  const [submittedSearch, setSubmittedSearch] = useState("")
  const [selectedStatuses, setSelectedStatuses] = useState<ETAT_UTILISATEUR[]>([ETAT_UTILISATEUR.ATTENTE, ETAT_UTILISATEUR.ERROR])
  const [selectedAccountTypes, setSelectedAccountTypes] = useState<AccountTypeValue[]>([...accountTypes])
  const [selectedOpcos, setSelectedOpcos] = useState<OpcoValue[]>([...opcoValues])

  const filteredUsers = useMemo(() => {
    let users = allUsers
    if (submittedSearch) {
      const q = submittedSearch.toLowerCase()
      users = users.filter((u) => [u.establishment_raison_sociale, u.email, u.first_name, u.last_name, u.phone, u.establishment_siret].some((v) => v?.toLowerCase().includes(q)))
    }
    users = users.filter((u) => selectedStatuses.includes(getUserStatus(u.status as unknown as IUserRecruteur["status"]) as ETAT_UTILISATEUR))
    users = users.filter(({ type }) => selectedAccountTypes.includes(type as AccountTypeValue))
    const isOpcoDisabled = selectedAccountTypes.length > 0 && !selectedAccountTypes.includes(ENTREPRISE)
    if (!isOpcoDisabled) {
      users = users.filter((u) => selectedOpcos.includes(u.opco as OpcoValue))
    }
    return users
  }, [allUsers, submittedSearch, selectedStatuses, selectedAccountTypes, selectedOpcos])

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
      onSearch={setSubmittedSearch}
      onReset={() => {
        setSubmittedSearch("")
        setSelectedStatuses([ETAT_UTILISATEUR.ATTENTE, ETAT_UTILISATEUR.ERROR])
        setSelectedAccountTypes([...accountTypes])
        setSelectedOpcos([...opcoValues])
      }}
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
  onSearch,
  onReset,
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
  onSearch: (search: string) => void
  onReset: () => void
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
      <Box sx={{ mb: fr.spacing("6v") }}>
        <AdminSearchInput label="Rechercher" placeholder="Raison sociale, email, téléphone..." onSearch={onSearch} onReset={onReset} />
      </Box>

      {/* Ligne 2 : filtres */}
      <Box sx={{ display: "flex", flexWrap: "wrap", columnGap: fr.spacing("4v"), "& > .MuiFormControl-root": { mb: fr.spacing("6v") } }}>
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
