"use client"

import {
  Box,
  Button,
  Link as ChakraLink,
  Flex,
  Icon,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  useDisclosure,
  useToast,
} from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import dayjs from "dayjs"
import { useEffect, useState } from "react"

import { Breadcrumb } from "@/app/_components/Breadcrumb"
import { sortReactTableDate, sortReactTableString } from "@/common/utils/dateUtils"
import { ConfirmationActivationUtilsateur, ConfirmationDesactivationUtilisateur, LoadingEmptySpace, TableNew } from "@/components/espace_pro"
import Link from "@/components/Link"
import { Parametre } from "@/theme/components/icons"
import { getOpcoUsers } from "@/utils/api"
import { PAGES } from "@/utils/routes.utils"
import { useSearchParamsRecord } from "@/utils/useSearchParamsRecord"

function AdministrationOpco() {
  const { newUser } = useSearchParamsRecord()
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

  const { data, isLoading } = useQuery({
    queryKey: ["user-list-opco"],
    queryFn: () => getOpcoUsers(),
  })

  const columns = [
    {
      Header: "Entreprise",
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
        const { establishment_raison_sociale, establishment_siret, _id, establishment_id } = data[id]
        return (
          <Flex direction="column">
            <Link fontWeight="700" href={PAGES.dynamic.backOpcoEditionEntreprise({ establishment_id }).getPath()}>
              {establishment_raison_sociale}
            </Link>
            <Text color="#666666" fontSize="14px">
              SIRET {establishment_siret}
            </Text>
          </Flex>
        )
      },
      filter: "fuzzyText",
    },
    {
      Header: "Nom",
      id: "first_name",
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
      id: "origin",
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
      Header: "Actions",
      id: "action",
      maxWidth: "80",
      disableSortBy: true,
      accessor: (row) => {
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
                      <Link href={PAGES.dynamic.backOpcoEditionEntreprise({ establishment_id: row.establishment_id }).getPath()}>Voir les informations</Link>
                    </MenuItem>
                    <MenuItem>
                      <Link href={`/espace-pro/administration/opco/entreprise/${row.establishment_siret}/${row.establishment_id}`}>Voir les offres</Link>
                    </MenuItem>
                    {tabIndex !== 1 && (
                      <MenuItem>
                        <ChakraLink
                          onClick={() => {
                            confirmationActivationUtilisateur.onOpen()
                            setCurrentEntreprise(row)
                          }}
                        >
                          Activer le compte
                        </ChakraLink>
                      </MenuItem>
                    )}
                    {tabIndex !== 2 && (
                      <MenuItem>
                        <ChakraLink
                          onClick={() => {
                            confirmationDesactivationUtilisateur.onOpen()
                            setCurrentEntreprise(row)
                          }}
                        >
                          Désactiver le compte
                        </ChakraLink>
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

  if (isLoading) {
    return <LoadingEmptySpace />
  }

  return (
    <>
      <ConfirmationDesactivationUtilisateur {...confirmationDesactivationUtilisateur} userRecruteur={currentEntreprise} />
      <ConfirmationActivationUtilsateur {...confirmationActivationUtilisateur} {...currentEntreprise} />

      <Breadcrumb pages={[PAGES.static.backOpcoHome]} />

      <Flex align="center" justify="space-between" mb={12}>
        <Text fontSize="2rem" fontWeight={700}>
          Entreprises
        </Text>
      </Flex>

      <Tabs index={tabIndex} onChange={(index) => setTabIndex(index)} variant="search" isLazy>
        <Box mx={8}>
          <TabList>
            <Tab width="300px">En attente de vérification ({data.awaiting.length})</Tab>
            <Tab width="300px">Actives ({data.active.length})</Tab>
            <Tab width="300px">Désactivées ({data.disable.length})</Tab>
          </TabList>
        </Box>
        <TabPanels mt={3}>
          <TabPanel>
            {/* @ts-expect-error: TODO */}
            <TableNew
              columns={columns}
              data={data.awaiting}
              description="Les entreprises en attente de vérification représentent pour votre OPCO de nouvelles opportunités d’accompagnement.  Vous pouvez contacter chacun des comptes en attente, vérifier qu’il s’agit bien d’une entreprise relevant de vos champs de compétences, et qu’il ne s’agit pas d’une tentative d’usurpation de compte."
            />
          </TabPanel>
          <TabPanel>{isLoading ? <LoadingEmptySpace /> : <TableNew columns={columns} data={data.active} exportable />}</TabPanel>
          {/* @ts-expect-error: TODO */}
          <TabPanel>{isLoading ? <LoadingEmptySpace /> : <TableNew columns={columns} data={data.disable} />}</TabPanel>
        </TabPanels>
      </Tabs>
    </>
  )
}

export default AdministrationOpco
