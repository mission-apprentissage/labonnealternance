"use client"
import { fr } from "@codegouvfr/react-dsfr"
import { Box, Link, Typography } from "@mui/material"
import { useQuery } from "@tanstack/react-query"
import dayjs from "dayjs"
import { useParams } from "next/navigation"
import { useEffect, useState } from "react"
import type { IUserRecruteurForAdminJSON, IUserRecruteurJson } from "shared"

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

type TabKey = "awaiting" | "active" | "disabled" | "error"

export function UsersList() {
  const { newUser } = useParams() as { newUser: string }
  const [currentTab, setCurrentTab] = useState<TabKey>("awaiting")
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

  return (
    <>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: fr.spacing("3w") }}>
        <Typography sx={{ fontSize: "2rem", fontWeight: 700 }}>Gestion des recruteurs</Typography>
      </Box>

      <CustomTabs
        currentTab={currentTab}
        onChange={setCurrentTab}
        panels={[
          {
            id: "awaiting" as const,
            title: `En attente de vérification`,
            content: <TabContent status={ETAT_UTILISATEUR.ATTENTE} />,
          },
          {
            id: "active" as const,
            title: "Actifs",
            content: <TabContent status={ETAT_UTILISATEUR.VALIDE} />,
          },
          {
            id: "disabled" as const,
            title: `Désactivés`,
            content: <TabContent status={ETAT_UTILISATEUR.DESACTIVE} />,
          },
          {
            id: "error" as const,
            title: `En erreur`,
            content: <TabContent status={ETAT_UTILISATEUR.ERROR} />,
          },
        ]}
      />
    </>
  )
}

const accountTypes = ["Tous", CFA, ENTREPRISE] as const
const opcoValues = ["Tous", ...Object.values(OPCOS_LABEL)] as const

type AccountType = (typeof accountTypes)[number]
type OpcoValue = (typeof opcoValues)[number]

const validTypesForOpcoFilter: AccountType[] = ["Tous", ENTREPRISE]

function TabContent({ status }: { status: ETAT_UTILISATEUR }) {
  const [currentEntreprise, setCurrentEntreprise] = useState<IUserRecruteurForAdminJSON | null>(null)
  const confirmationDesactivationUtilisateur = useDisclosure()
  const confirmationActivationUtilisateur = useDisclosure()
  const [accountType, setAccountType] = useState<AccountType>("Tous")
  const [opco, setOpco] = useState<OpcoValue>("Tous")

  const { data: dataRaw, isLoading } = useQuery({
    queryKey: ["/admin/users-recruteurs", status],
    queryFn: () => {
      return apiGet("/admin/users-recruteurs", {
        querystring: {
          status,
        },
      })
    },
  })
  let data = dataRaw as IUserRecruteurJson[]

  if (isLoading) {
    return <LoadingEmptySpace />
  }

  if (accountType !== "Tous") {
    data = data.filter(({ type }) => type === accountType)
  }
  if (opco !== "Tous") {
    data = data.filter((userRecruteur) => userRecruteur.opco === opco)
  }

  const columns = [
    {
      Header: "",
      id: "action",
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
      <ConfirmationDesactivationUtilisateur {...confirmationDesactivationUtilisateur} userRecruteur={currentEntreprise} />
      <ConfirmationActivationUtilisateur
        onClose={confirmationActivationUtilisateur.onClose}
        isOpen={confirmationActivationUtilisateur.isOpen}
        _id={currentEntreprise?._id}
        establishment_raison_sociale={currentEntreprise?.establishment_raison_sociale}
      />
      <Box sx={{ display: "flex", gap: fr.spacing("2w") }}>
        <SelectField
          id="account-type"
          label="Type de compte"
          style={{
            minWidth: "200px",
          }}
          options={accountTypes.map((option) => ({ value: option, label: option, selected: option === accountType }))}
          nativeSelectProps={{
            required: true,
            value: accountType,
            onChange: (event) => {
              const { value } = event.target
              if (!validTypesForOpcoFilter.includes(value)) {
                setOpco("Tous")
              }
              setAccountType(value)
            },
          }}
        />
        <SelectField
          id="opco"
          label="OPCO"
          style={{
            minWidth: "200px",
          }}
          options={opcoValues.map((option) => ({ value: option, label: option, selected: option === opco }))}
          nativeSelectProps={{
            disabled: !validTypesForOpcoFilter.includes(accountType),
            required: true,
            value: opco,
            onChange: (event) => {
              const { value } = event.target
              setOpco(value)
            },
          }}
        />
      </Box>
      <Typography
        sx={{
          fontSize: "16px",
          lineHeight: "24px",
          color: "#666666",
          marginTop: fr.spacing("2w"),
          marginBottom: fr.spacing("2w") + "!important",
        }}
      >
        {data.length} comptes {statusLabels[status].toLocaleLowerCase()} :
      </Typography>
      <TableWithPagination columns={columns} data={data ?? []} description={null} exportable={null} />
    </>
  )
}

const statusLabels = {
  [ETAT_UTILISATEUR.ATTENTE]: `En attente de vérification`,
  [ETAT_UTILISATEUR.VALIDE]: "Actifs",
  [ETAT_UTILISATEUR.DESACTIVE]: `Désactivés`,
  [ETAT_UTILISATEUR.ERROR]: `En erreur`,
}
