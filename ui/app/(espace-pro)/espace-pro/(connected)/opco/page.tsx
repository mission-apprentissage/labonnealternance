"use client"

import { fr } from "@codegouvfr/react-dsfr"
import { Box, Link, Typography } from "@mui/material"
import { useQuery } from "@tanstack/react-query"
import dayjs from "dayjs"
import { useEffect, useState } from "react"
import type { IUserRecruteurForAdminJSON } from "shared"

import { UserMenu } from "./_component/UserMenu"
import TableWithPagination from "@/app/(espace-pro)/_components/TableWithPagination"
import { Breadcrumb } from "@/app/_components/Breadcrumb"
import { useToast } from "@/app/hooks/useToast"
import { useDisclosure } from "@/common/hooks/useDisclosure"
import { sortReactTableDate, sortReactTableString } from "@/common/utils/dateUtils"
import { ConfirmationDesactivationUtilisateur, LoadingEmptySpace } from "@/components/espace_pro"
import ConfirmationActivationUtilisateur from "@/components/espace_pro/ConfirmationActivationUtilisateur"
import { CustomTabs } from "@/components/espace_pro/CreationRecruteur/CustomTabs"
import { webkitLineClamp } from "@/styles/webkitLineClamp"
import { getOpcoUsers } from "@/utils/api"
import { PAGES } from "@/utils/routes.utils"
import { useSearchParamsRecord } from "@/utils/useSearchParamsRecord"

type TabKey = "awaiting" | "active" | "disabled"

function AdministrationOpco() {
  const { newUser } = useSearchParamsRecord()
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

  const { data, isLoading } = useQuery({
    queryKey: ["user-list-opco"],
    queryFn: () => getOpcoUsers(),
  })

  const columns = [
    {
      Header: "",
      id: "action",
      maxWidth: "40",
      disableSortBy: true,
      accessor: (row) => {
        return (
          <UserMenu
            row={row}
            tabIndex={currentTab}
            setCurrentEntreprise={setCurrentEntreprise}
            confirmationActivationUtilisateur={confirmationActivationUtilisateur}
            confirmationDesactivationUtilisateur={confirmationDesactivationUtilisateur}
          />
        )
      },
    },
    {
      Header: "Entreprise",
      id: "establishment_raison_sociale",
      width: "280",
      accessor: "establishment_raison_sociale",
      sortType: (a, b) => sortReactTableString(a.original.establishment_raison_sociale, b.original.establishment_raison_sociale),
      Cell: ({
        data,
        cell: {
          row: { id },
        },
      }) => {
        const { establishment_raison_sociale, establishment_siret, _id } = data[id]
        return (
          <Box sx={{ display: "flex", flexDirection: "column" }}>
            <Link
              underline="hover"
              href={PAGES.dynamic.backOpcoInformationEntreprise({ user_id: _id }).getPath()}
              sx={{
                fontWeight: "700",
              }}
            >
              {establishment_raison_sociale}
            </Link>
            <Typography sx={{ color: "#666666", fontSize: "14px" }}>SIRET {establishment_siret}</Typography>
          </Box>
        )
      },
      filter: "fuzzyText",
    },
    {
      Header: "Nom",
      id: "first_name",
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
      Cell: ({ value }) => (
        <Typography
          sx={{
            color: "#666666",
            fontSize: "14px",
            ...webkitLineClamp,
          }}
        >
          {value}
        </Typography>
      ),
      filter: "fuzzyTypography",
    },
    {
      Header: "Téléphone",
      accessor: "phone",
      Cell: ({ value }) => <Typography sx={{ color: "#666666", fontSize: "14px" }}>{value}</Typography>,
      filter: "text",
    },
    {
      Header: "Créé le",
      accessor: "createdAt",
      Cell: ({ value }) => <Typography sx={{ color: "#666666", fontSize: "14px" }}>{dayjs(value).format("DD/MM/YYYY")}</Typography>,
      id: "createdAt",
      sortType: (a, b) => sortReactTableDate(a.original.createdAt, b.original.createdAt),
    },
    {
      Header: "Offres",
      maxWidth: "70",
      id: "nombre_offres",
      disableSortBy: true,
      sortType: "basic",
      accessor: ({ jobs_count }) => jobs_count,
    },
    {
      Header: "Origine",
      accessor: "origin",
      width: "200",
      Cell: ({ value }) => <Typography sx={{ color: "#666666", fontSize: "14px", ...webkitLineClamp }}>{value}</Typography>,
      id: "origin",
    },
  ]

  if (isLoading) {
    return <LoadingEmptySpace />
  }

  return (
    <>
      <ConfirmationDesactivationUtilisateur {...confirmationDesactivationUtilisateur} userRecruteur={currentEntreprise} />
      <ConfirmationActivationUtilisateur
        onClose={confirmationActivationUtilisateur.onClose}
        isOpen={confirmationActivationUtilisateur.isOpen}
        _id={currentEntreprise?._id}
        establishment_raison_sociale={currentEntreprise?.establishment_raison_sociale}
      />

      <Breadcrumb pages={[PAGES.static.backOpcoHome]} />

      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: fr.spacing("3w") }}>
        <Typography sx={{ fontSize: "2rem", fontWeight: 700 }}>Entreprises</Typography>
      </Box>

      <CustomTabs
        currentTab={currentTab}
        onChange={setCurrentTab}
        panels={[
          {
            id: "awaiting" as const,
            title: `En attente de vérification (${data.awaiting.length})`,
            content: (
              <TableWithPagination
                columns={columns}
                data={data.awaiting}
                description="Les entreprises en attente de vérification représentent pour votre OPCO de nouvelles opportunités d'accompagnement.  Vous pouvez contacter chacun des comptes en attente, vérifier qu'il s'agit bien d'une entreprise relevant de vos champs de compétences, et qu'il ne s'agit pas d'une tentative d'usurpation de compte."
                exportable={null}
              />
            ),
          },
          {
            id: "active" as const,
            title: `Actives ${data.active.length}`,
            content: <TableWithPagination columns={columns} data={data.active} exportable />,
          },
          {
            id: "disabled" as const,
            title: `Désactivés (${data.disable.length})`,
            content: <TableWithPagination columns={columns} data={data.disable} description={null} exportable={null} />,
          },
        ]}
      />
    </>
  )
}

export default AdministrationOpco
