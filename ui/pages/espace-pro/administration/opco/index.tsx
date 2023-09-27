import {
  Box,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Button,
  Container,
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
  Link as ChakraLink,
} from "@chakra-ui/react"
import dayjs from "dayjs"
import { useRouter } from "next/router"
import { useEffect, useState } from "react"
import { useQuery } from "react-query"

import { USER_STATUS } from "../../../../common/contants"
import useAuth from "../../../../common/hooks/useAuth"
import { sortReactTableDate, sortReactTableString } from "../../../../common/utils/dateUtils"
import { AnimationContainer, ConfirmationActivationUtilsateur, ConfirmationDesactivationUtilisateur, Layout, LoadingEmptySpace, TableNew } from "../../../../components/espace_pro"
import withAuth from "../../../../components/espace_pro/withAuth"
import Link from "../../../../components/Link"
import { ArrowDropRightLine, Parametre } from "../../../../theme/components/icons"
import { getOpcoUsers } from "../../../../utils/api"

function AdministrationOpco() {
  const [currentEntreprise, setCurrentEntreprise] = useState({})
  const [tabIndex, setTabIndex] = useState(0)
  const confirmationDesactivationUtilisateur = useDisclosure()
  const confirmationActivationUtilisateur = useDisclosure()
  const router = useRouter()
  const [auth] = useAuth()
  const toast = useToast()

  useEffect(() => {
    if (router.query.newUser) {
      toast({
        title: "Vérification réussie",
        description: "Votre adresse mail a été validée avec succès.",
        position: "top-right",
        status: "success",
        duration: 7000,
        isClosable: true,
      })
    }
  }, [])

  const awaitingValidationUserList = useQuery("awaitingValidationUserList", () =>
    getOpcoUsers({
      userQuery: {
        $expr: { $eq: [{ $arrayElemAt: ["$status.status", -1] }, USER_STATUS.WAITING] },
        opco: auth.scope,
      },
      formulaireQuery: { opco: auth.scope },
    })
  )

  const activeUserList = useQuery("activeUserList", () =>
    getOpcoUsers({
      userQuery: {
        $expr: { $eq: [{ $arrayElemAt: ["$status.status", -1] }, USER_STATUS.ACTIVE] },
        opco: auth.scope,
      },
      formulaireQuery: { opco: auth.scope },
    })
  )

  const disableUserList = useQuery("disableUserList", () =>
    getOpcoUsers({
      userQuery: {
        $expr: { $eq: [{ $arrayElemAt: ["$status.status", -1] }, USER_STATUS.DISABLED] },
        opco: auth.scope,
      },
      formulaireQuery: { opco: auth.scope },
    })
  )

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
        const { establishment_raison_sociale, establishment_siret, _id } = data[id]
        return (
          <Flex direction="column">
            <Link fontWeight="700" href={`/espace-pro/administration/opco/entreprise/${_id}`}>
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
      accessor: ({ jobs }) => jobs,
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
                      <Link href={`/espace-pro/administration/opco/entreprise/${row._id}`}>Voir les informations</Link>
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

  if (awaitingValidationUserList.isLoading) {
    return <LoadingEmptySpace />
  }

  return (
    <AnimationContainer>
      <ConfirmationDesactivationUtilisateur {...confirmationDesactivationUtilisateur} {...currentEntreprise} />
      <ConfirmationActivationUtilsateur {...confirmationActivationUtilisateur} {...currentEntreprise} />

      <Container maxW="container.xl" mt={5}>
        <Box mt="16px" mb={6}>
          <Breadcrumb separator={<ArrowDropRightLine color="grey.600" />} textStyle="xs">
            <BreadcrumbItem>
              <BreadcrumbLink textStyle="xs">Entreprises</BreadcrumbLink>
            </BreadcrumbItem>
          </Breadcrumb>
        </Box>

        <Flex align="center" justify="space-between" mb={12}>
          <Text fontSize="2rem" fontWeight={700}>
            Entreprises
          </Text>
        </Flex>

        <Tabs index={tabIndex} onChange={(index) => setTabIndex(index)} variant="search" isLazy>
          <Box mx={8}>
            <TabList>
              <Tab width="300px">En attente de vérification ({awaitingValidationUserList.data.data.length})</Tab>
              <Tab width="300px">Actives {activeUserList.isFetched && `(${activeUserList.data.data.length})`}</Tab>
              <Tab width="300px">Désactivées {disableUserList.isFetched && `(${disableUserList.data.data.length})`}</Tab>
            </TabList>
          </Box>
          <TabPanels mt={3}>
            <TabPanel>
              {/* @ts-expect-error: TODO */}
              <TableNew
                columns={columns}
                data={awaitingValidationUserList.data.data}
                description="Les entreprises en attente de vérification représentent pour votre OPCO de nouvelles opportunités d’accompagnement.  Vous pouvez contacter chacun des comptes en attente, vérifier qu’il s’agit bien d’une entreprise relevant de vos champs de compétences, et qu’il ne s’agit pas d’une tentative d’usurpation de compte."
              />
            </TabPanel>
            {/* @ts-expect-error: TODO */}
            <TabPanel>{activeUserList.isLoading ? <LoadingEmptySpace /> : <TableNew columns={columns} data={activeUserList?.data?.data} exportable />}</TabPanel>
            {/* @ts-expect-error: TODO */}
            <TabPanel>{disableUserList.isLoading ? <LoadingEmptySpace /> : <TableNew columns={columns} data={disableUserList?.data?.data} />}</TabPanel>
          </TabPanels>
        </Tabs>
      </Container>
    </AnimationContainer>
  )
}

function AdministrationOpcoPage() {
  return (
    <Layout footer={false}>
      <AdministrationOpco />
    </Layout>
  )
}
export default withAuth(AdministrationOpcoPage)
