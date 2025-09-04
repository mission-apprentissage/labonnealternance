"use client"

import { useToast } from "@chakra-ui/react"
import { fr } from "@codegouvfr/react-dsfr"
import { TabContext, TabList, TabPanel } from "@mui/lab"
import { Box, Link, Tab, Typography } from "@mui/material"
import { useQuery } from "@tanstack/react-query"
import dayjs from "dayjs"
import { useEffect, useState } from "react"
import { IUserRecruteurForAdminJSON } from "shared"

import TableWithPagination from "@/app/(espace-pro)/_components/TableWithPagination"
import { UserMenu } from "@/app/(espace-pro)/espace-pro/(connected)/opco/_component/UserMenu"
import { Breadcrumb } from "@/app/_components/Breadcrumb"
import { useDisclosure } from "@/common/hooks/useDisclosure"
import { sortReactTableDate, sortReactTableString } from "@/common/utils/dateUtils"
import { ConfirmationDesactivationUtilisateur, LoadingEmptySpace } from "@/components/espace_pro"
import ConfirmationActivationUtilisateur from "@/components/espace_pro/ConfirmationActivationUtilisateur"
import { webkitLineClamp } from "@/styles/webkitLineClamp"
import { getOpcoUsers } from "@/utils/api"
import { PAGES } from "@/utils/routes.utils"
import { useSearchParamsRecord } from "@/utils/useSearchParamsRecord"

function AdministrationOpco() {
  const { newUser } = useSearchParamsRecord()
  const [currentEntreprise, setCurrentEntreprise] = useState<IUserRecruteurForAdminJSON | null>(null)
  const [tabIndex, setTabIndex] = useState("0")
  const confirmationDesactivationUtilisateur = useDisclosure()
  const confirmationActivationUtilisateur = useDisclosure()
  const toast = useToast()

  useEffect(() => {
    if (newUser) {
      toast({
        title: "Vérification réussie",
        description: "Votre adresse mail a été validée avec succès.",
        position: "top-right",
        status: "success",
        duration: 7000,
        isClosable: true,
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
            tabIndex={tabIndex}
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
            <Link underline="hover" fontWeight="700" href={PAGES.dynamic.backOpcoInformationEntreprise({ user_id: _id }).getPath()}>
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
      Cell: ({ value }) => (
        <Typography
          sx={{ color: "#666666", fontSize: "14px", overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}
        >
          {value}
        </Typography>
      ),
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

      <TabContext value={tabIndex}>
        <Box mx={fr.spacing("4w")} className="fr-tabs">
          <TabList className="fr-tabs__list" onChange={(_, index) => setTabIndex(index)} variant="scrollable" scrollButtons="auto" allowScrollButtonsMobile>
            <Tab label={`En attente de vérification (${data.awaiting.length})`} value="0" className="fr-tabs__tab" wrapped />
            <Tab label={`Actives ${data.active.length}`} value="1" className="fr-tabs__tab" wrapped />
            <Tab label={`Désactivés (${data.disable.length})`} value="2" className="fr-tabs__tab" wrapped />
          </TabList>
        </Box>
        <TabPanel value="0">
          {/* @ts-expect-error: TODO */}
          <TableWithPagination
            columns={columns}
            data={data.awaiting}
            description="Les entreprises en attente de vérification représentent pour votre OPCO de nouvelles opportunités d’accompagnement.  Vous pouvez contacter chacun des comptes en attente, vérifier qu’il s’agit bien d’une entreprise relevant de vos champs de compétences, et qu’il ne s’agit pas d’une tentative d’usurpation de compte."
          />
        </TabPanel>
        <TabPanel value="1">{isLoading ? <LoadingEmptySpace /> : <TableWithPagination columns={columns} data={data.active} exportable />}</TabPanel>

        <TabPanel value="2">
          {/* @ts-expect-error: TODO */}
          {isLoading ? <LoadingEmptySpace /> : <TableWithPagination columns={columns} data={data.disable} />}
        </TabPanel>
      </TabContext>
    </>
  )
}

export default AdministrationOpco
