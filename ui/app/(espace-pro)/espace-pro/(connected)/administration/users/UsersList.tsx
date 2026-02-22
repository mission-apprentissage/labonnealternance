"use client"
import { fr } from "@codegouvfr/react-dsfr"
import { Box, Link, Typography } from "@mui/material"
import { useQuery } from "@tanstack/react-query"
import dayjs from "dayjs"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import type { IUserRecruteurForAdminJSON, IUserRecruteurJson } from "shared"
import { entriesToTypedRecord } from "shared"

import { CFA, ENTREPRISE, ETAT_UTILISATEUR, OPCOS_LABEL } from "shared/constants/recruteur"
import { UserMenu } from "./_component/UserMenu"
import LoadingEmptySpace from "@/app/(espace-pro)/_components/LoadingEmptySpace"
import TableWithPagination from "@/app/(espace-pro)/_components/TableWithPagination"
import { SelectField } from "@/app/_components/FormComponents/SelectField"
import { useToast } from "@/app/hooks/useToast"
import { useDisclosure } from "@/common/hooks/useDisclosure"
import { sortReactTableDate, sortReactTableString } from "@/common/utils/dateUtils"
import { ConfirmationDesactivationUtilisateur } from "@/components/espace_pro"
import ConfirmationActivationUtilisateur from "@/components/espace_pro/ConfirmationActivationUtilisateur"
import { CustomTabs } from "@/components/espace_pro/CreationRecruteur/CustomTabs"
import { webkitLineClamp } from "@/styles/webkitLineClamp"
import { apiGet } from "@/utils/api.utils"
import { PAGES } from "@/utils/routes.utils"
import { useSearchParamsRecord } from "@/utils/useSearchParamsRecord"

const panelOrder = [ETAT_UTILISATEUR.ATTENTE, ETAT_UTILISATEUR.VALIDE, ETAT_UTILISATEUR.DESACTIVE, ETAT_UTILISATEUR.ERROR]
const accountTypes = [CFA, ENTREPRISE] as const
const opcoValues = [...Object.values(OPCOS_LABEL)] as const

type AccountType = (typeof accountTypes)[number] | undefined
type OpcoValue = (typeof opcoValues)[number] | undefined

const validTypesForOpcoFilter: AccountType[] = [undefined, ENTREPRISE]

const activeUserLimit = 100

const routeBuilder = PAGES.dynamic.backAdminGestionDesRecruteurs

type RouteParams = { newUser?: string } & Partial<Parameters<typeof routeBuilder>[0]>

export function UsersList() {
  const routeParamsRaw = useSearchParamsRecord() as RouteParams
  const [routeParams, setRouteParams] = useState<RouteParams>(routeParamsRaw)
  const { newUser, status, accountType, opco, page: pageStr } = routeParams
  const pageIndex = pageStr !== undefined ? parseInt(pageStr, 10) - 1 : 0
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
      const data = dataRaw as IUserRecruteurJson[]
      return [etatUtilisateur, { data, refetch, isLoading }] as const
    })
  )

  const isCurrentTabLoading = queryResults[currentTab].isLoading

  function refetchAll() {
    Object.values(queryResults).map(async (x) => x.refetch())
  }

  function onOpcoChange(newValue: OpcoValue) {
    updateRouteParams({
      ...routeParams,
      opco: newValue,
      page: undefined,
    })
  }

  function onAccountTypeChange(newValue: AccountType) {
    updateRouteParams({
      ...routeParams,
      accountType: newValue,
      opco: validTypesForOpcoFilter.includes(newValue) ? opco : undefined,
      page: undefined,
    })
  }

  function onStatusChange(newStatus: ETAT_UTILISATEUR) {
    updateRouteParams({
      ...routeParams,
      status: newStatus,
      page: undefined,
    })
  }

  function onPageChange(newValue: number) {
    updateRouteParams({
      ...routeParams,
      page: (newValue + 1).toString(),
    })
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
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: fr.spacing("6v") }}>
        <Typography sx={{ fontSize: "2rem", fontWeight: 700 }}>Gestion des recruteurs</Typography>
      </Box>

      <CustomTabs
        currentTab={currentTab}
        onChange={onStatusChange}
        panels={panelsData.map(({ etatUtilisateur, isCountAccurate, id, title, userRecruteurs }) => {
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
                isCountAccurate={isCountAccurate}
                page={pageIndex}
                onPageChange={onPageChange}
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
  isCountAccurate,
  page,
  onPageChange,
}: {
  status: ETAT_UTILISATEUR
  userRecruteurs: IUserRecruteurJson[]
  onInvalidateData: () => void
  accountType: AccountType
  onAccountTypeChange: (newValue: AccountType) => void
  opco: OpcoValue
  onOpcoChange: (newValue: OpcoValue) => void
  isCountAccurate: boolean
  page: number
  onPageChange: (newPage: number) => void
}) {
  const [currentEntreprise, setCurrentEntreprise] = useState<IUserRecruteurForAdminJSON | null>(null)
  const confirmationDesactivationUtilisateur = useDisclosure()
  const confirmationActivationUtilisateur = useDisclosure()

  const columns = [
    {
      Header: "",
      id: "action",
      srOnly: "Actions sur le recruteur",
      maxWidth: "40",
      disableSortBy: true,
      accessor: (row: IUserRecruteurJson) => {
        return (
          <UserMenu
            row={row}
            setCurrentEntreprise={setCurrentEntreprise}
            confirmationActivationUtilisateur={confirmationActivationUtilisateur}
            confirmationDesactivationUtilisateur={confirmationDesactivationUtilisateur}
          />
        )
      },
    },
    {
      Header: "Etablissement",
      id: "establishment_raison_sociale",
      width: "350",
      accessor: "establishment_raison_sociale",
      sortType: (a, b) => sortReactTableString(a.original.establishment_raison_sociale, b.original.establishment_raison_sociale),
      Cell: ({
        data,
        cell: {
          row: { id },
        },
      }) => {
        const { establishment_raison_sociale, establishment_siret, _id, opco } = data[id]
        const siretText = <Typography sx={{ color: "#666666", fontSize: "14px" }}>SIRET {establishment_siret}</Typography>
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
            <Typography sx={{ maxWidth: "100%", textOverflow: "ellipsis", whiteSpace: "nowrap", overflow: "hidden", color: "redmarianne", fontSize: "14px" }}>{opco}</Typography>
          </Box>
        )
      },
      filter: "fuzzyText",
    },
    {
      Header: "Type",
      id: "type",
      maxWidth: "140",
      accessor: ({ type }) => <Typography sx={{ color: "#666666", fontSize: "14px" }}>{type}</Typography>,
    },
    {
      Header: "Nom",
      id: "nom",
      width: "200",
      accessor: ({ last_name, first_name }) => (
        <Typography sx={{ color: "#666666", fontSize: "14px" }}>
          {first_name} {last_name}
        </Typography>
      ),
    },
    {
      Header: "Email",
      width: "250",
      accessor: "email",
      Cell: ({ value }) => <Typography sx={{ color: "#666666", fontSize: "14px", ...webkitLineClamp }}>{value}</Typography>,
      filter: "fuzzyText",
    },
    {
      Header: "Téléphone",
      accessor: "phone",
      width: "160",
      Cell: ({ value }) => <Typography sx={{ color: "#666666", fontSize: "14px" }}>{value}</Typography>,
      filter: "text",
    },
    {
      Header: "Créé le",
      accessor: "createdAt",
      Cell: ({ value }) => <Typography sx={{ color: "#666666", fontSize: "14px" }}>{dayjs(value).format("DD/MM/YYYY")}</Typography>,
      width: "130",
      id: "createdAt",
      sortType: (a, b) => sortReactTableDate(a.original.createdAt, b.original.createdAt),
    },
    {
      Header: "Origine",
      accessor: "origin",
      Cell: ({ value }) => <Typography sx={{ color: "#666666", fontSize: "14px", ...webkitLineClamp }}>{value}</Typography>,
      width: "300",
      id: "origine",
    },
  ]

  return (
    <>
      <ConfirmationDesactivationUtilisateur {...confirmationDesactivationUtilisateur} userRecruteur={currentEntreprise} onUpdate={onInvalidateData} />
      <ConfirmationActivationUtilisateur
        onClose={confirmationActivationUtilisateur.onClose}
        isOpen={confirmationActivationUtilisateur.isOpen}
        _id={currentEntreprise?._id}
        establishment_raison_sociale={currentEntreprise?.establishment_raison_sociale}
        onConfirmation={onInvalidateData}
      />
      <Box sx={{ display: "flex", gap: fr.spacing("4v") }}>
        <AccountTypeSelect value={accountType} onChange={onAccountTypeChange} />
        <OpcoSelect value={opco} onChange={onOpcoChange} accountType={accountType} />
      </Box>
      <Typography
        sx={{
          fontSize: "16px",
          lineHeight: "24px",
          color: "#666666",
          marginTop: fr.spacing("4v"),
          marginBottom: fr.spacing("4v") + "!important",
        }}
      >
        {userRecruteurs.length}
        {!isCountAccurate && "+"} comptes {statusLabels[queryStatus].toLocaleLowerCase()} :
      </Typography>
      <TableWithPagination
        caption="Liste des recruteurs"
        columns={columns}
        data={userRecruteurs}
        description={null}
        exportable={null}
        pageIndex={page}
        onPageChange={onPageChange}
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
      style={{
        minWidth: "200px",
      }}
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
      style={{
        minWidth: "200px",
      }}
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
