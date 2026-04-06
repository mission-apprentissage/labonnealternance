"use client"
import { fr } from "@codegouvfr/react-dsfr"
import { Box, Link, Stack, Typography } from "@mui/material"
import { keepPreviousData, useQuery } from "@tanstack/react-query"
import type { ColumnDef } from "@tanstack/react-table"
import dayjs from "dayjs"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import type { IUserRecruteurForAdminJSON, IUserRecruteurJson } from "shared"
import { entriesToTypedRecord } from "shared"
import { CFA, ENTREPRISE, ETAT_UTILISATEUR, OPCOS_LABEL } from "shared/constants/recruteur"
import { SelectField } from "@/app/_components/FormComponents/SelectField"
import LoadingEmptySpace from "@/app/(espace-pro)/_components/LoadingEmptySpace"
import { VirtualTable } from "@/app/(espace-pro)/_components/VirtualTable"
import { useToast } from "@/app/hooks/useToast"
import { useDisclosure } from "@/common/hooks/useDisclosure"
import { sortReactTableDate, sortReactTableString } from "@/common/utils/dateUtils"
import { ConfirmationDesactivationUtilisateur } from "@/components/espace_pro"
import ConfirmationActivationUtilisateur from "@/components/espace_pro/ConfirmationActivationUtilisateur"
import { CustomTag } from "@/components/SearchForTrainingsAndJobs/components/CustomTag"
import { apiGet } from "@/utils/api.utils"
import { PAGES } from "@/utils/routes.utils"
import { useSearchParamsRecord } from "@/utils/useSearchParamsRecord"
import { UserMenu } from "./_component/UserMenu"

const accountTypes = [CFA, ENTREPRISE] as const
const opcoValues = [...Object.values(OPCOS_LABEL)] as const
const validTypesForOpcoFilter: AccountType[] = [undefined, ENTREPRISE]
const activeUserLimit = 100
const routeBuilder = PAGES.dynamic.backAdminGestionDesRecruteurs

type AccountType = (typeof accountTypes)[number] | undefined
type OpcoValue = (typeof opcoValues)[number] | undefined
type RouteParams = { newUser?: string } & Partial<Parameters<typeof routeBuilder>[0]>

const statusLabels = {
  [ETAT_UTILISATEUR.ATTENTE]: "En attente de vérification",
  [ETAT_UTILISATEUR.VALIDE]: "Actifs",
  [ETAT_UTILISATEUR.DESACTIVE]: "Désactivés",
  [ETAT_UTILISATEUR.ERROR]: "En erreur",
}

export function UsersList() {
  const routeParamsRaw = useSearchParamsRecord() as RouteParams
  const [routeParams, setRouteParams] = useState<RouteParams>(routeParamsRaw)
  const { newUser, status, accountType, opco } = routeParams
  const currentStatus = (status as ETAT_UTILISATEUR) ?? ETAT_UTILISATEUR.ATTENTE
  const toast = useToast()
  const router = useRouter()

  function updateRouteParams(newParams: RouteParams) {
    const finalParams = { ...routeParams, ...newParams }
    setRouteParams(finalParams)
    router.replace(routeBuilder(finalParams).getPath())
  }

  useEffect(() => {
    if (newUser) {
      toast({
        title: "Vérification réussie",
        description: "Votre adresse mail a été validée avec succès.",
        autoHideDuration: 7000,
      })
    }
  }, [newUser, toast])

  const queryResult = useQuery({
    queryKey: ["/admin/users-recruteurs", currentStatus],
    queryFn: () =>
      apiGet("/admin/users-recruteurs", {
        querystring: {
          status: currentStatus,
          ...(currentStatus === ETAT_UTILISATEUR.VALIDE ? { limit: activeUserLimit.toString() } : {}),
        },
      }),
    staleTime: 1000 * 60 * 20,
    placeholderData: keepPreviousData,
  })

  const { data: dataRaw, refetch, isLoading } = queryResult
  const allUsers = (dataRaw as IUserRecruteurForAdminJSON[]) ?? []

  const filteredUsers = useMemo(() => {
    let users = allUsers
    if (accountType) users = users.filter(({ type }) => type === accountType)
    if (opco) users = users.filter((u) => u.opco === opco)
    return users
  }, [allUsers, accountType, opco])

  if (isLoading) {
    return <LoadingEmptySpace />
  }

  const isCountAccurate = allUsers.length !== activeUserLimit
  const statusLabel = `${statusLabels[currentStatus]} (${filteredUsers.length}${!isCountAccurate ? "+" : ""})`

  return (
    <UserContent
      status={currentStatus}
      statusLabel={statusLabel}
      userRecruteurs={filteredUsers}
      onInvalidateData={() => refetch()}
      accountType={accountType as AccountType}
      opco={opco as OpcoValue}
      onStatusChange={(s) => updateRouteParams({ ...routeParams, status: s })}
      onAccountTypeChange={(v) =>
        updateRouteParams({
          ...routeParams,
          accountType: v,
          opco: validTypesForOpcoFilter.includes(v) ? opco : undefined,
        })
      }
      onOpcoChange={(v) => updateRouteParams({ ...routeParams, opco: v })}
    />
  )
}

function UserContent({
  status: queryStatus,
  statusLabel,
  userRecruteurs,
  onInvalidateData,
  accountType,
  onAccountTypeChange,
  opco,
  onOpcoChange,
  onStatusChange,
}: {
  status: ETAT_UTILISATEUR
  statusLabel: string
  userRecruteurs: IUserRecruteurJson[]
  onInvalidateData: () => void
  accountType: AccountType
  onAccountTypeChange: (newValue: AccountType) => void
  opco: OpcoValue
  onOpcoChange: (newValue: OpcoValue) => void
  onStatusChange: (newValue: ETAT_UTILISATEUR) => void
}) {
  const [currentEntreprise, setCurrentEntreprise] = useState<IUserRecruteurForAdminJSON | null>(null)
  const confirmationDesactivationUtilisateur = useDisclosure()
  const confirmationActivationUtilisateur = useDisclosure()

  const columns: ColumnDef<IUserRecruteurJson>[] = [
    {
      id: "action",
      header: "",
      meta: { srOnly: "Actions sur le recruteur" },
      size: 50,
      enableSorting: false,
      cell: (info) => (
        <UserMenu
          row={info.row.original}
          setCurrentEntreprise={setCurrentEntreprise}
          confirmationActivationUtilisateur={confirmationActivationUtilisateur}
          confirmationDesactivationUtilisateur={confirmationDesactivationUtilisateur}
        />
      ),
    },
    {
      id: "establishment_raison_sociale",
      header: "Etablissement",
      accessorKey: "establishment_raison_sociale",
      size: 350,
      sortingFn: (a, b) => sortReactTableString(a.original.establishment_raison_sociale, b.original.establishment_raison_sociale),
      cell: (info) => {
        const { establishment_raison_sociale, establishment_siret, _id, opco, type } = info.row.original
        const siretText = (
          <Typography sx={{ color: "#666666", fontSize: ".75rem" }}>
            SIRET {establishment_siret} <CustomTag color={type === "CFA" ? "yellow" : "green"}>{type}</CustomTag>
          </Typography>
        )
        return (
          <Box sx={{ display: "flex", flexDirection: "column" }}>
            <Link fontWeight="700" href={`/espace-pro/administration/users/${_id}`} aria-label="voir les informations">
              {establishment_raison_sociale}
            </Link>
            {establishment_raison_sociale ? (
              siretText
            ) : (
              <Link fontWeight="700" href={`/espace-pro/administration/users/${_id}`} aria-label="voir les informations">
                {siretText}
              </Link>
            )}
            <Typography sx={{ color: "#666666", maxWidth: "100%", textOverflow: "ellipsis", whiteSpace: "nowrap", overflow: "hidden", fontSize: ".75rem" }}>
              Opco : {opco}
            </Typography>
          </Box>
        )
      },
    },
    {
      id: "nom",
      header: "Contact",
      size: 300,
      enableSorting: false,
      accessorFn: (row) => `${row.first_name} ${row.last_name} ${row.email} ${row.phone}`,
      cell: (info) => {
        const { last_name, first_name, email, phone } = info.row.original
        return (
          <Stack spacing={0.5}>
            <Typography sx={{ color: "#666666", fontSize: ".75rem", fontWeight: 700 }}>
              {first_name} {last_name}
            </Typography>
            <Typography sx={{ color: "#666666", fontSize: ".75rem", whiteSpace: "normal", wordBreak: "break-all" }}>
              {email} ~ {phone}
            </Typography>
          </Stack>
        )
      },
    },
    {
      id: "createdAt",
      header: "Créé le",
      accessorKey: "createdAt",
      size: 130,
      sortingFn: (a, b) => sortReactTableDate(a.original.createdAt, b.original.createdAt),
      cell: (info) => <Typography sx={{ color: "#666666", fontSize: ".75rem" }}>{dayjs(info.getValue<string>()).format("DD/MM/YYYY")}</Typography>,
    },
    {
      id: "hasJobs",
      header: "Détail",
      accessorKey: "hasJobs",
      size: 200,
      enableSorting: false,
      cell: (info) => (info.getValue<boolean>() ? <CustomTag color="green">A des offres publiées</CustomTag> : <CustomTag color="pink">Aucune offre publiée</CustomTag>),
    },
  ]

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
      <Box sx={{ display: "flex", gap: fr.spacing("4v"), mb: fr.spacing("4v") }}>
        <StatusSelect value={queryStatus} onChange={onStatusChange} />
        <AccountTypeSelect value={accountType} onChange={onAccountTypeChange} />
        <OpcoSelect value={opco} onChange={onOpcoChange} accountType={accountType} />
      </Box>
      <VirtualTable
        caption={statusLabel}
        columns={columns}
        data={userRecruteurs}
        searchPlaceholder="Rechercher par raison sociale, email ou téléphone..."
        defaultSortBy={[queryStatus === ETAT_UTILISATEUR.ATTENTE ? { id: "createdAt", desc: false } : { id: "createdAt", desc: true }]}
      />
    </>
  )
}

function StatusSelect({ value, onChange }: { value: ETAT_UTILISATEUR; onChange: (newValue: ETAT_UTILISATEUR) => void }) {
  return (
    <SelectField
      id="status"
      label="Statut"
      style={{ minWidth: "260px" }}
      options={Object.entries(statusLabels).map(([key, label]) => ({ value: key, label, selected: key === value }))}
      nativeSelectProps={{
        required: true,
        value,
        onChange: (event) => onChange(event.target.value as ETAT_UTILISATEUR),
      }}
    />
  )
}

function AccountTypeSelect({ value, onChange }: { value: AccountType; onChange: (newValue: AccountType) => void }) {
  const localValue = value ?? "Tous"
  const possibleValues = ["Tous", ...accountTypes] as const
  return (
    <SelectField
      id="account-type"
      label="Type de compte"
      style={{ minWidth: "200px" }}
      options={possibleValues.map((option) => ({ value: option, label: option, selected: option === value }))}
      nativeSelectProps={{
        required: true,
        value: localValue,
        onChange: (event) => {
          const { value: newValue } = event.target
          onChange(newValue === "Tous" ? undefined : newValue)
        },
      }}
    />
  )
}

function OpcoSelect({ value, onChange, accountType }: { value: OpcoValue; onChange: (newValue: OpcoValue) => void; accountType: AccountType }) {
  const localValue = value ?? "Tous"
  const possibleValues = ["Tous", ...opcoValues] as const
  return (
    <SelectField
      id="opco"
      label="OPCO"
      style={{ minWidth: "200px" }}
      options={possibleValues.map((option) => ({ value: option, label: option, selected: option === value }))}
      nativeSelectProps={{
        disabled: !validTypesForOpcoFilter.includes(accountType),
        required: true,
        value: localValue,
        onChange: (event) => {
          const { value: newValue } = event.target
          onChange(newValue === "Tous" ? undefined : newValue)
        },
      }}
    />
  )
}
