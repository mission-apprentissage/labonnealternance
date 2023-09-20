import {
  Box,
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
// eslint-disable-next-line import/no-extraneous-dependencies
import dayjs from "dayjs"
import { useRouter } from "next/router"
import { useEffect, useState } from "react"
import { useQuery } from "react-query"

import { AUTHTYPE, USER_STATUS } from "../../../../common/contants"
import useAuth from "../../../../common/hooks/useAuth"
import { sortReactTableDate, sortReactTableString } from "../../../../common/utils/dateUtils"
import { AnimationContainer, ConfirmationActivationUtilsateur, ConfirmationDesactivationUtilisateur, LoadingEmptySpace, TableNew } from "../../../../components/espace_pro"
import Link from "../../../../components/Link"
import { Parametre } from "../../../../theme/components/icons"
import { getUsers } from "../../../../utils/api"

export default function Users() {
  const [currentEntreprise, setCurrentEntreprise] = useState()
  const [tabIndex, setTabIndex] = useState(0)
  const confirmationDesactivationUtilisateur = useDisclosure()
  const confirmationActivationUtilisateur = useDisclosure()
  const router = useRouter()
  const toast = useToast()
  const [auth] = useAuth()
  const isAdmin = auth.type === AUTHTYPE.ADMIN

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

  let queries = [
    {
      id: "awaitingValidationUserList",
      label: "En attente de vérification",
      query: {
        establishment_raison_sociale: { $nin: [null, ""] },
        $expr: { $eq: [{ $arrayElemAt: ["$status.status", -1] }, USER_STATUS.WAITING] },
        $or: [{ type: AUTHTYPE.CFA }, { type: AUTHTYPE.ENTREPRISE }],
      },
    },
    {
      id: "activeUserList",
      label: "Actifs",
      query: {
        establishment_raison_sociale: { $nin: [null, ""] },
        $expr: { $eq: [{ $arrayElemAt: ["$status.status", -1] }, USER_STATUS.ACTIVE] },
        $or: [{ type: AUTHTYPE.CFA }, { type: AUTHTYPE.ENTREPRISE }],
      },
    },
    {
      id: "disableUserList",
      label: "Désactivés",
      query: {
        $expr: { $eq: [{ $arrayElemAt: ["$status.status", -1] }, USER_STATUS.DISABLED] },
        $or: [{ type: AUTHTYPE.CFA }, { type: AUTHTYPE.ENTREPRISE }],
      },
    },
  ]
  if (isAdmin) {
    const errorQuery = {
      id: "errorUserList",
      label: "En erreur",
      query: {
        $expr: { $eq: [{ $arrayElemAt: ["$status.status", -1] }, USER_STATUS.ERROR] },
        $or: [{ type: AUTHTYPE.CFA }, { type: AUTHTYPE.ENTREPRISE }],
      },
    }
    queries = [errorQuery, ...queries]
  }

  const queryResponses = queries.map(({ query, id }) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useQuery(id, () =>
      getUsers({
        users: query,
      })
    )
  })

  if (queryResponses[0].isLoading) {
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
      accessor: (row) => {
        const { status: statusArray = [] } = row
        const lastStatus = statusArray[statusArray.length - 1]
        const { status } = lastStatus
        const canActivate = [USER_STATUS.DISABLED, USER_STATUS.WAITING].includes(status)
        const canDeactivate = [USER_STATUS.ACTIVE, USER_STATUS.WAITING].includes(status)
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
      <ConfirmationDesactivationUtilisateur {...confirmationDesactivationUtilisateur} {...currentEntreprise} />
      <ConfirmationActivationUtilsateur {...confirmationActivationUtilisateur} {...currentEntreprise} />

      <Container maxW="container.xl" mt={5}>
        <Flex align="center" justify="space-between" mb={12}>
          <Text fontSize="2rem" fontWeight={700}>
            Gestion des utilisateurs
          </Text>
        </Flex>

        <Tabs index={tabIndex} onChange={(index) => setTabIndex(index)} variant="search" isLazy>
          <Box mx={8}>
            <TabList>
              {queryResponses.map((response, index) => {
                const { label } = queries[index]
                return (
                  <Tab key={label} width="300px">
                    {label} {response.isFetched && `(${response.data.data.length})`}
                  </Tab>
                )
              })}
            </TabList>
          </Box>
          <TabPanels mt={3}>
            {queryResponses.map((response, index) => {
              const { label } = queries[index]
              return <TabPanel key={label}>{response.isLoading ? <LoadingEmptySpace /> : <TableNew columns={columns} data={response?.data?.data} />}</TabPanel>
            })}
          </TabPanels>
        </Tabs>
      </Container>
    </AnimationContainer>
  )
}
// TODO_AB add HOC restriction page PRIVATE ROUTE redirect to /
