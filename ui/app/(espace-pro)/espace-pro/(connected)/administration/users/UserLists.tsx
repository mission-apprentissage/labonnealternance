"use client"
import { fr } from "@codegouvfr/react-dsfr"
import { Box, Link, Typography } from "@mui/material"
import { useQuery } from "@tanstack/react-query"
import dayjs from "dayjs"
import { useParams } from "next/navigation"
import { useEffect, useState } from "react"
import type { IUserRecruteurForAdminJSON, IUserRecruteurJson } from "shared"

import { UserMenu } from "./_component/UserMenu"
import LoadingEmptySpace from "@/app/(espace-pro)/_components/LoadingEmptySpace"
import TableWithPagination from "@/app/(espace-pro)/_components/TableWithPagination"
import { useToast } from "@/app/hooks/useToast"
import { useDisclosure } from "@/common/hooks/useDisclosure"
import { sortReactTableDate, sortReactTableString } from "@/common/utils/dateUtils"
import { ConfirmationDesactivationUtilisateur } from "@/components/espace_pro"
import ConfirmationActivationUtilisateur from "@/components/espace_pro/ConfirmationActivationUtilisateur"
import { CustomTabs } from "@/components/espace_pro/CreationRecruteur/CustomTabs"
import { webkitLineClamp } from "@/styles/webkitLineClamp"
import { apiGet } from "@/utils/api.utils"

type TabKey = "awaiting" | "active" | "disabled" | "error"

function Users() {
  const { newUser } = useParams() as { newUser: string }
  const [currentEntreprise, setCurrentEntreprise] = useState<IUserRecruteurForAdminJSON | null>(null)
  const [currentTab, setCurrentTab] = useState<TabKey>("awaiting")
  const confirmationDesactivationUtilisateur = useDisclosure()
  const confirmationActivationUtilisateur = useDisclosure()
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

  const { isLoading, data } = useQuery({
    queryKey: ["user-list"],
    queryFn: () => apiGet("/user", {}),
  })

  if (isLoading) {
    return <LoadingEmptySpace />
  }

  const columns = [
    {
      Header: "",
      id: "action",
      maxWidth: "40",
      disableSortBy: true,
      // isSticky: true,
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

      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: fr.spacing("3w") }}>
        <Typography sx={{ fontSize: "2rem", fontWeight: 700 }}>Gestion des recruteurs</Typography>
      </Box>

      <CustomTabs
        currentTab={currentTab}
        onChange={setCurrentTab}
        panels={[
          {
            id: "awaiting" as const,
            title: `En attente de vérification (${data.awaiting.length})`,
            content: <TableWithPagination columns={columns} data={data.awaiting} description={null} exportable={null} />,
          },
          {
            id: "active" as const,
            title: "Actifs",
            content: <TableWithPagination columns={columns} data={data.active} description={null} exportable={null} />,
          },
          {
            id: "disabled" as const,
            title: `Désactivés (${data.disabled.length})`,
            content: <TableWithPagination columns={columns} data={data.disabled} description={null} exportable={null} />,
          },
          {
            id: "error" as const,
            title: `En erreur (${data.error.length})`,
            content: <TableWithPagination columns={columns} data={data.error} description={null} exportable={null} />,
          },
        ]}
      />
    </>
  )
}

export default Users
