"use client"
import { fr } from "@codegouvfr/react-dsfr"
import { Box, Link, Stack, Typography } from "@mui/material"
import { useQuery } from "@tanstack/react-query"
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
import { CustomTabs } from "@/components/espace_pro/CreationRecruteur/CustomTabs"
import { CustomTag } from "@/components/SearchForTrainingsAndJobs/components/CustomTag"
import { apiGet } from "@/utils/api.utils"
import { PAGES } from "@/utils/routes.utils"
import { useSearchParamsRecord } from "@/utils/useSearchParamsRecord"
import { UserMenu } from "./_component/UserMenu"

const panelOrder = [ETAT_UTILISATEUR.ATTENTE, ETAT_UTILISATEUR.VALIDE, ETAT_UTILISATEUR.DESACTIVE, ETAT_UTILISATEUR.ERROR]
const accountTypes = [CFA, ENTREPRISE] as const
const opcoValues = [...Object.values(OPCOS_LABEL)] as const
const validTypesForOpcoFilter: AccountType[] = [undefined, ENTREPRISE]
const activeUserLimit = 100
const routeBuilder = PAGES.dynamic.backAdminGestionDesRecruteurs

type AccountType = (typeof accountTypes)[number] | undefined
type OpcoValue = (typeof opcoValues)[number] | undefined
type RouteParams = { newUser?: string } & Partial<Parameters<typeof routeBuilder>[0]>

export function UsersList() {
  const routeParamsRaw = useSearchParamsRecord() as RouteParams
  const [routeParams, setRouteParams] = useState<RouteParams>(routeParamsRaw)
  const { newUser, status, accountType, opco } = routeParams
  const currentTab = status ?? ETAT_UTILISATEUR.ATTENTE
  const toast = useToast()
  const router = useRouter()

  function updateRouteParams(newParams: RouteParams) {
    const finalParams = {
      ...routeParams,
      ...newParams,
    }
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

  const queryResults = entriesToTypedRecord(
    panelOrder.map((etatUtilisateur) => {
      // c'est ok parce que le nombre de useQuery est constant
      // eslint-disable-next-line react-hooks/rules-of-hooks
      // biome-ignore lint/correctness/useHookAtTopLevel: migration
      const useQueryResult = useQuery({
        queryKey: ["/admin/users-recruteurs", etatUtilisateur],
        queryFn: () => {
          return apiGet("/admin/users-recruteurs", {
            querystring: {
              status: etatUtilisateur,
              ...(etatUtilisateur === ETAT_UTILISATEUR.VALIDE ? { limit: activeUserLimit.toString() } : {}),
            },
          })
        },
        staleTime: 1000 * 60 * 20, // 20 minutes
      })
      const { data: dataRaw, refetch, isLoading } = useQueryResult
      const data = dataRaw as IUserRecruteurForAdminJSON[]
      return [etatUtilisateur, { data, refetch, isLoading }] as const
    })
  )

  const isCurrentTabLoading = queryResults[currentTab].isLoading

  function refetchAll() {
    Object.values(queryResults).map(async (x) => x.refetch())
  }

  function onOpcoChange(newValue: OpcoValue) {
    updateRouteParams({ ...routeParams, opco: newValue })
  }

  function onAccountTypeChange(newValue: AccountType) {
    updateRouteParams({
      ...routeParams,
      accountType: newValue,
      opco: validTypesForOpcoFilter.includes(newValue) ? opco : undefined,
    })
  }

  function onStatusChange(newStatus: ETAT_UTILISATEUR) {
    updateRouteParams({ ...routeParams, status: newStatus })
  }

  const panelsData = useMemo(() => {
    return panelOrder.map((etatUtilisateur) => {
      let { data: userRecruteurs } = queryResults[etatUtilisateur]
      const isCountAccurate = Boolean(userRecruteurs && userRecruteurs.length !== activeUserLimit)
      let title = statusLabels[etatUtilisateur]
      if (userRecruteurs) {
        if (accountType) {
          userRecruteurs = userRecruteurs.filter(({ type }) => type === accountType)
        }
        if (opco) {
          userRecruteurs = userRecruteurs.filter((userRecruteur) => userRecruteur.opco === opco)
        }
        title += ` (${userRecruteurs.length}${!isCountAccurate ? "+" : ""})`
      }
      return {
        id: etatUtilisateur,
        title,
        userRecruteurs,
        isCountAccurate,
        etatUtilisateur,
      }
    })
  }, [queryResults])

  if (isCurrentTabLoading) {
    return <LoadingEmptySpace />
  }

  return (
    <>
      <CustomTabs
        currentTab={currentTab}
        onChange={onStatusChange}
        panels={panelsData.map(({ etatUtilisateur, id, title, userRecruteurs }) => {
          return {
            id,
            title,
            content: (
              <TabContent
                status={etatUtilisateur}
                userRecruteurs={userRecruteurs ?? []}
                onInvalidateData={refetchAll}
                accountType={accountType}
                opco={opco}
                onAccountTypeChange={onAccountTypeChange}
                onOpcoChange={onOpcoChange}
              />
            ),
          }
        })}
      />
    </>
  )
}

function TabContent({
  status: queryStatus,
  userRecruteurs,
  onInvalidateData,
  accountType,
  onAccountTypeChange,
  opco,
  onOpcoChange,
}: {
  status: ETAT_UTILISATEUR
  userRecruteurs: IUserRecruteurJson[]
  onInvalidateData: () => void
  accountType: AccountType
  onAccountTypeChange: (newValue: AccountType) => void
  opco: OpcoValue
  onOpcoChange: (newValue: OpcoValue) => void
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
        <AccountTypeSelect value={accountType} onChange={onAccountTypeChange} />
        <OpcoSelect value={opco} onChange={onOpcoChange} accountType={accountType} />
      </Box>
      <VirtualTable
        caption="Liste des recruteurs"
        columns={columns}
        data={userRecruteurs}
        searchPlaceholder="Rechercher par raison sociale, email ou téléphone..."
        defaultSortBy={[queryStatus === ETAT_UTILISATEUR.ATTENTE ? { id: "createdAt", desc: false } : { id: "createdAt", desc: true }]}
      />
    </>
  )
}

const statusLabels = {
  [ETAT_UTILISATEUR.ATTENTE]: `En attente de vérification`,
  [ETAT_UTILISATEUR.VALIDE]: "Actifs",
  [ETAT_UTILISATEUR.DESACTIVE]: `Désactivés`,
  [ETAT_UTILISATEUR.ERROR]: `En erreur`,
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
