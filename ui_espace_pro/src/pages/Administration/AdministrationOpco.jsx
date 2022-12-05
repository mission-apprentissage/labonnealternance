import {
  Box,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Button,
  Container,
  Flex,
  Heading,
  Icon,
  Image,
  Link,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Stack,
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
import { NavLink, useLocation, useNavigate } from "react-router-dom"
import { getOpcoUsers } from "../../api"
import addOfferImage from "../../assets/images/add-offer.svg"
import { USER_STATUS } from "../../common/contants"
import useAuth from "../../common/hooks/useAuth"
import { sortReactTableDate, sortReactTableString } from "../../common/utils/dateUtils"
import { AnimationContainer, ConfirmationActivationUtilsateur, ConfirmationDesactivationUtilisateur, LoadingEmptySpace, TableNew } from "../../components"
import { ArrowDropRightLine, Parametre } from "../../theme/components/icons"

const EmptySpace = () => (
  <Stack direction={["column", "column", "column", "row"]} mt={12} pt={12} py={8} border="1px solid" borderColor="grey.400" spacing="32px">
    <Flex justify={["center", "center", "center", "flex-end"]} align={["center", "center", "center", "flex-start"]} w={["100%", "100%", "100%", "350px"]} h="150px">
      <Image src={addOfferImage} />
    </Flex>

    <Box w={["100%", "100%", "100%", "600px"]}>
      <Heading fontSize="2rem" pb={7}>
        Créez votre première entreprise mandatée.
      </Heading>
      <Text fontSize="1.375rem">Une entreprise vous a mandaté pour gérer ses offres d’emploi ?</Text>
      <Text fontSize="1.375rem">
        En quelques secondes, exprimez les besoins de recrutement de cette entreprise pour les afficher sur le site <span style={{ fontWeight: "700" }}>La bonne alternance</span>{" "}
        dès aujourd’hui.
      </Text>
    </Box>
  </Stack>
)

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
    getOpcoUsers({
      userQuery: {
        $expr: { $eq: [{ $arrayElemAt: ["$etat_utilisateur.statut", -1] }, USER_STATUS.WAITING] },
        opco: auth.scope,
      },
      formulaireQuery: { opco: auth.scope },
    })
  )

  const activeUserList = useQuery("activeUserList", () =>
    getOpcoUsers({
      userQuery: {
        $expr: { $eq: [{ $arrayElemAt: ["$etat_utilisateur.statut", -1] }, USER_STATUS.ACTIVE] },
        opco: auth.scope,
      },
      formulaireQuery: { opco: auth.scope },
    })
  )

  const disableUserList = useQuery("disableUserList", () =>
    getOpcoUsers({
      userQuery: {
        $expr: { $eq: [{ $arrayElemAt: ["$etat_utilisateur.statut", -1] }, USER_STATUS.DISABLED] },
        opco: auth.scope,
      },
      formulaireQuery: { opco: auth.scope },
    })
  )

  if (awaitingValidationUserList.isLoading) {
    return <LoadingEmptySpace />
  }

  const columns = [
    {
      Header: "Entreprise",
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
        const { raison_sociale, siret, _id } = data[id]
        return (
          <Flex direction="column">
            <Link fontWeight="700" as={NavLink} to={`/administration/opco/entreprise/${_id}`}>
              {raison_sociale}
            </Link>
            <Text color="#666666" fontSize="14px">
              SIRET {siret}
            </Text>
          </Flex>
        )
      },
      filter: "fuzzyText",
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
      Header: "Offres",
      maxWidth: "70",
      id: "nombre_offres",
      disableSortBy: true,
      sortType: "basic",
      accessor: ({ offres }) => offres,
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
                      <Link as={NavLink} to={`/administration/opco/entreprise/${row._id}`}>
                        Voir les informations
                      </Link>
                    </MenuItem>
                    <MenuItem>
                      <Link as={NavLink} to={`/administration/opco/entreprise/${row.siret}/${row.id_form}`}>
                        Voir les offres
                      </Link>
                    </MenuItem>
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
          {/* <Button variant='primary' size='sm' mr={3} onClick={() => navigate(`/administration/entreprise`)}>
              Nouvelle entreprise
            </Button> */}
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
              <TableNew
                columns={columns}
                data={awaitingValidationUserList.data.data}
                description="Les entreprises en attente de vérification représentent pour votre OPCO de nouvelles opportunités d’accompagnement.  Vous pouvez contacter chacun des comptes en attente, vérifier qu’il s’agit bien d’une entreprise relevant de vos champs de compétences, et qu’il ne s’agit pas d’une tentative d’usurpation de compte."
              />
            </TabPanel>
            <TabPanel>{activeUserList.isLoading ? <LoadingEmptySpace /> : <TableNew columns={columns} data={activeUserList?.data?.data} />}</TabPanel>
            <TabPanel>{disableUserList.isLoading ? <LoadingEmptySpace /> : <TableNew columns={columns} data={disableUserList?.data?.data} />}</TabPanel>
          </TabPanels>
        </Tabs>
      </Container>
    </AnimationContainer>
  )
})
