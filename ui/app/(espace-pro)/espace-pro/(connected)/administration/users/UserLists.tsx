"use client"
import { Box, Button, Flex, Icon, Menu, MenuButton, MenuItem, MenuList, Tab, TabList, TabPanel, TabPanels, Tabs, Text, useDisclosure, useToast } from "@chakra-ui/react"
import { Link } from "@mui/material"
import { useQuery } from "@tanstack/react-query"
import dayjs from "dayjs"
import { useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { getLastStatusEvent, IUserRecruteurJson, IUserStatusValidationJson } from "shared"
import { ETAT_UTILISATEUR } from "shared/constants/recruteur"

import LoadingEmptySpace from "@/app/(espace-pro)/_components/LoadingEmptySpace"
import { sortReactTableDate, sortReactTableString } from "@/common/utils/dateUtils"
import { ConfirmationActivationUtilsateur, ConfirmationDesactivationUtilisateur, TableNew } from "@/components/espace_pro"
import { Parametre } from "@/theme/components/icons"
import { apiGet } from "@/utils/api.utils"

function Users() {
  const { newUser } = useParams() as { newUser: string }
  const [currentEntreprise, setCurrentEntreprise] = useState({})
  const [tabIndex, setTabIndex] = useState(0)
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

  const { isLoading, data } = useQuery(["user-list"], () => apiGet("/user", {}))

  if (isLoading) {
    return <LoadingEmptySpace />
  }

  const columns = [
    {
      Header: "Etablissement",
      id: "establishment_raison_sociale",
      width: "300",
      accessor: "establishment_raison_sociale",
      sortType: (a, b) => sortReactTableString(a.original.establishment_raison_sociale, b.original.establishment_raison_sociale),
      Cell: ({
        data,
        cell: {
          row: { id },
        },
      }) => {
        const { establishment_raison_sociale, establishment_siret, _id, opco } = data[id]
        const siretText = (
          <Text color="#666666" fontSize="14px">
            SIRET {establishment_siret}
          </Text>
        )
        return (
          <Flex direction="column">
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
            <Text color="redmarianne" fontSize="14px">
              {opco}
            </Text>
          </Flex>
        )
      },
      filter: "fuzzyText",
    },
    {
      Header: "Type",
      id: "type",
      maxWidth: "100",
      accessor: ({ type }) => (
        <Text color="#666666" fontSize="14px">
          {type}
        </Text>
      ),
    },
    {
      Header: "Nom",
      id: "nom",
      accessor: ({ last_name, first_name }) => (
        <Text color="#666666" fontSize="14px">
          {first_name} {last_name}
        </Text>
      ),
    },
    {
      Header: "Email",
      width: "200",
      accessor: "email",
      Cell: ({ value }) => (
        <Text color="#666666" fontSize="14px" noOfLines={2}>
          {value}
        </Text>
      ),
      filter: "fuzzyText",
    },
    {
      Header: "Téléphone",
      accessor: "phone",
      Cell: ({ value }) => (
        <Text color="#666666" fontSize="14px">
          {value}
        </Text>
      ),
      filter: "text",
    },
    {
      Header: "Créé le",
      accessor: "createdAt",
      Cell: ({ value }) => (
        <Text color="#666666" fontSize="14px">
          {dayjs(value).format("DD/MM/YYYY")}
        </Text>
      ),
      id: "createdAt",
      sortType: (a, b) => sortReactTableDate(a.original.createdAt, b.original.createdAt),
    },
    {
      Header: "Origine",
      accessor: "origin",
      Cell: ({ value }) => (
        <Text color="#666666" fontSize="14px" noOfLines={2}>
          {value}
        </Text>
      ),
      id: "origine",
    },
    {
      Header: "Actions",
      id: "action",
      maxWidth: "80",
      disableSortBy: true,
      accessor: (row: IUserRecruteurJson) => {
        const status = getLastStatusEvent(row.status as IUserStatusValidationJson[])?.status
        const canActivate = [ETAT_UTILISATEUR.DESACTIVE, ETAT_UTILISATEUR.ATTENTE].includes(status)
        const canDeactivate = [ETAT_UTILISATEUR.VALIDE, ETAT_UTILISATEUR.ATTENTE].includes(status)
        return (
          <Box display={["none", "block"]}>
            <Menu>
              {({ isOpen }) => (
                <>
                  <MenuButton isActive={isOpen} as={Button} variant="navdot" _hover={{ backgroundColor: "none" }}>
                    <Icon as={Parametre} color="bluefrance.500" />
                  </MenuButton>
                  <MenuList>
                    <MenuItem>
                      <Link underline="hover" href={`/espace-pro/administration/users/${row._id}`} aria-label="voir les informations">
                        Voir les informations
                      </Link>
                    </MenuItem>
                    {canActivate && (
                      <MenuItem>
                        <Link
                          underline="hover"
                          component="button"
                          onClick={() => {
                            confirmationActivationUtilisateur.onOpen()
                            setCurrentEntreprise(row)
                          }}
                        >
                          Activer le compte
                        </Link>
                      </MenuItem>
                    )}
                    {canDeactivate && (
                      <MenuItem>
                        <Link
                          underline="hover"
                          component="button"
                          onClick={() => {
                            confirmationDesactivationUtilisateur.onOpen()
                            setCurrentEntreprise(row)
                          }}
                        >
                          Désactiver le compte
                        </Link>
                      </MenuItem>
                    )}
                  </MenuList>
                </>
              )}
            </Menu>
          </Box>
        )
      },
    },
  ]

  return (
    <>
      <ConfirmationDesactivationUtilisateur {...confirmationDesactivationUtilisateur} userRecruteur={currentEntreprise} />
      <ConfirmationActivationUtilsateur {...confirmationActivationUtilisateur} {...currentEntreprise} />

      <Flex align="center" justify="space-between" mb={12}>
        <Text fontSize="2rem" fontWeight={700}>
          Gestion des recruteurs
        </Text>
      </Flex>

      <Tabs index={tabIndex} onChange={(index) => setTabIndex(index)} variant="search" isLazy>
        <Box mx={8}>
          <TabList>
            <Tab width="300px">En attente de vérification ({data.awaiting.length})</Tab>
            <Tab width="300px">Actifs</Tab>
            <Tab width="300px">Désactivés ({data.disabled.length})</Tab>
            <Tab width="300px">En erreur ({data.error.length})</Tab>
          </TabList>
        </Box>
        <TabPanels mt={3}>
          <TabPanel>
            <TableNew columns={columns} data={data.awaiting} description={null} exportable={null} />
          </TabPanel>
          <TabPanel>
            <TableNew columns={columns} data={data.active} description={null} exportable={null} />
          </TabPanel>
          <TabPanel>
            <TableNew columns={columns} data={data.disabled} description={null} exportable={null} />
          </TabPanel>
          <TabPanel>
            <TableNew columns={columns} data={data.error} description={null} exportable={null} />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </>
  )
}

export default Users
