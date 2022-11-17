import {
  Box,
  Button,
  Container,
  Flex,
  Icon,
  Link,
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
import { memo, useEffect, useState } from "react"
import { useQuery } from "react-query"
import { useLocation, useNavigate } from "react-router-dom"
import { getUsers } from "../../api"
import { AUTHTYPE, USER_STATUS } from "../../common/contants"
import useAuth from "../../common/hooks/useAuth"
import { sortReactTableDate, sortReactTableString } from "../../common/utils/dateUtils"
import { AnimationContainer, ConfirmationActivationUtilsateur, ConfirmationDesactivationUtilisateur, LoadingEmptySpace, TableNew } from "../../components"
import { Parametre } from "../../theme/components/icons"
import "./search.css"

export default memo(() => {
  const [currentEntreprise, setCurrentEntreprise] = useState()
  const [tabIndex, setTabIndex] = useState(0)
  const confirmationDesactivationUtilisateur = useDisclosure()
  const confirmationActivationUtilisateur = useDisclosure()
  const location = useLocation()
  const navigate = useNavigate()
  const [auth] = useAuth()
  const toast = useToast()

  useEffect(() => {
    if (location.state?.newUser) {
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
    getUsers({
      users: {
        $expr: { $eq: [{ $arrayElemAt: ["$etat_utilisateur.statut", -1] }, USER_STATUS.WAITING] },
        $or: [{ type: AUTHTYPE.CFA }, { type: AUTHTYPE.ENTREPRISE }],
      },
    })
  )

  const activeUserList = useQuery("activeUserList", () =>
    getUsers({
      users: {
        $expr: { $eq: [{ $arrayElemAt: ["$etat_utilisateur.statut", -1] }, USER_STATUS.ACTIVE] },
        $or: [{ type: AUTHTYPE.CFA }, { type: AUTHTYPE.ENTREPRISE }],
      },
    })
  )

  const disableUserList = useQuery("disableUserList", () =>
    getUsers({
      users: {
        $expr: { $eq: [{ $arrayElemAt: ["$etat_utilisateur.statut", -1] }, USER_STATUS.DISABLED] },
        $or: [{ type: AUTHTYPE.CFA }, { type: AUTHTYPE.ENTREPRISE }],
      },
    })
  )

  if (awaitingValidationUserList.isLoading) {
    return <LoadingEmptySpace />
  }

  const columns = [
    {
      Header: "Etablissement",
      id: "raison_sociale",
      width: "300",
      accessor: "raison_sociale",
      sortType: (a, b) => sortReactTableString(a.original.raison_sociale, b.original.raison_sociale),
      Cell: ({
        data,
        cell: {
          row: { id },
        },
      }) => {
        const { raison_sociale, siret, _id, opco } = data[id]
        return (
          <Flex direction="column">
            <Text fontWeight="700">{raison_sociale}</Text>
            <Text color="#666666" fontSize="14px">
              SIRET {siret}
            </Text>
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
      accessor: ({ nom, prenom }) => (
        <Text color="#666666" fontSize="14px">
          {prenom} {nom}
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
      accessor: "telephone",
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
      accessor: "origine",
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
                    {tabIndex !== 1 && (
                      <MenuItem>
                        <Link
                          onClick={() => {
                            confirmationActivationUtilisateur.onOpen()
                            setCurrentEntreprise(row)
                          }}
                        >
                          Activer le compte
                        </Link>
                      </MenuItem>
                    )}
                    {tabIndex !== 2 && (
                      <MenuItem>
                        <Link
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
    <AnimationContainer>
      <ConfirmationDesactivationUtilisateur {...confirmationDesactivationUtilisateur} {...currentEntreprise} />
      <ConfirmationActivationUtilsateur {...confirmationActivationUtilisateur} {...currentEntreprise} />

      <Container maxW="container.xl" mt={5}>
        <div className="search-page">
          <Flex align="center" justify="space-between" mb={12}>
            <Text fontSize="2rem" fontWeight={700}>
              Gestion des utilisateurs
            </Text>
          </Flex>

          <Tabs index={tabIndex} onChange={(index) => setTabIndex(index)} variant="search" isLazy>
            <Box mx={8}>
              <TabList>
                <Tab width="300px">En attente de vérification ({awaitingValidationUserList.data.data.length})</Tab>
                <Tab width="300px">Actifs {activeUserList.isFetched && `(${activeUserList.data.data.length})`}</Tab>
                <Tab width="300px">Désactivés {disableUserList.isFetched && `(${disableUserList.data.data.length})`}</Tab>
              </TabList>
            </Box>
            <TabPanels mt={3}>
              <TabPanel>
                <TableNew columns={columns} data={awaitingValidationUserList.data.data} />
              </TabPanel>
              <TabPanel>{activeUserList.isLoading ? <LoadingEmptySpace /> : <TableNew columns={columns} data={activeUserList?.data?.data} />}</TabPanel>
              <TabPanel>{disableUserList.isLoading ? <LoadingEmptySpace /> : <TableNew columns={columns} data={disableUserList?.data?.data} />}</TabPanel>
            </TabPanels>
          </Tabs>
        </div>
      </Container>
    </AnimationContainer>
  )
})
