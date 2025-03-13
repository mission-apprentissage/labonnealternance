import {
  Box,
  Button,
  Link as ChakraLink,
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
} from "@chakra-ui/react"
import dayjs from "dayjs"
import { useRouter } from "next/router"
import { useEffect, useState } from "react"
import { useQuery } from "react-query"
import { getLastStatusEvent, IUserRecruteur } from "shared"
import { ETAT_UTILISATEUR } from "shared/constants/recruteur"

import { getAuthServerSideProps } from "@/common/SSR/getAuthServerSideProps"
import { EAdminPages } from "@/components/espace_pro/Layout/NavigationAdmin"
import { apiGet } from "@/utils/api.utils"

import { sortReactTableDate, sortReactTableString } from "../../../../common/utils/dateUtils"
import { AnimationContainer, ConfirmationActivationUtilsateur, ConfirmationDesactivationUtilisateur, Layout, LoadingEmptySpace, TableNew } from "../../../../components/espace_pro"
import { authProvider, withAuth } from "../../../../components/espace_pro/withAuth"
import Link from "../../../../components/Link"
import { Parametre } from "../../../../theme/components/icons"

function Users() {
  const [currentEntreprise, setCurrentEntreprise] = useState({})
  const [tabIndex, setTabIndex] = useState(0)
  const confirmationDesactivationUtilisateur = useDisclosure()
  const confirmationActivationUtilisateur = useDisclosure()
  const router = useRouter()
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

  const { isLoading, data } = useQuery("user-list", () => apiGet("/user", {}))

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
      accessor: (row: IUserRecruteur) => {
        const status = getLastStatusEvent(row.status)?.status
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
                      <Link href={`/espace-pro/administration/users/${row._id}`} aria-label="voir les informations">
                        Voir les informations
                      </Link>
                    </MenuItem>
                    {canActivate && (
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
                    {canDeactivate && (
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

  return (
    <AnimationContainer>
      <ConfirmationDesactivationUtilisateur {...confirmationDesactivationUtilisateur} userRecruteur={currentEntreprise} />
      <ConfirmationActivationUtilsateur {...confirmationActivationUtilisateur} {...currentEntreprise} />

      <Container maxW="container.xl" mt={5}>
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
      </Container>
    </AnimationContainer>
  )
}

function UsersPage() {
  return (
    <Layout displayNavigationMenu={false} adminPage={EAdminPages.GESTION_RECRUTEURS} footer={false}>
      <Users />
    </Layout>
  )
}

export const getServerSideProps = async (context) => ({ props: { ...(await getAuthServerSideProps(context)) } })

export default authProvider(withAuth(UsersPage, "admin"))
