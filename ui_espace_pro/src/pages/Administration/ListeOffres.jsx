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
import relativeTime from "dayjs/plugin/relativeTime"
import { useState } from "react"
import { useQuery, useQueryClient } from "react-query"
import { useNavigate, useParams } from "react-router-dom"
import { getFormulaire, putOffre } from "../../api"
import addOfferImage from "../../assets/images/add-offer.svg"
import { AUTHTYPE } from "../../common/contants"
import useAuth from "../../common/hooks/useAuth"
import { sortReactTableDate } from "../../common/utils/dateUtils"
import { ConfirmationSuppressionOffre, LoadingEmptySpace, Table } from "../../components"
import { ArrowDropRightLine, Building, ExternalLinkLine, Parametre, Plus } from "../../theme/components/icons"

const EmptySpace = () => (
  <Stack direction={["column", "column", "column", "row"]} mt={12} pt={12} py={8} border="1px solid" borderColor="grey.400" spacing="32px">
    <Flex justify={["center", "center", "center", "flex-end"]} align={["center", "center", "center", "flex-start"]} w={["100%", "100%", "100%", "350px"]} h="150px">
      <Image src={addOfferImage} />
    </Flex>

    <Box w={["100%", "100%", "100%", "600px"]}>
      <Heading fontSize="2rem" pb={7}>
        Ajoutez votre première offre d’emploi en alternance.
      </Heading>
      <Text fontSize="1.375rem">
        Décrivez vos besoins de recrutement pour les afficher sur le site <span style={{ fontWeight: "700" }}>La bonne alternance</span> dès aujourd’hui.
      </Text>
    </Box>
  </Stack>
)

const NumberCell = ({ children }) => {
  return (
    <Box as="span" textAlign="right" w="100%" pr={5}>
      {children}
    </Box>
  )
}

export const ListeOffres = () => {
  const navigate = useNavigate()
  const params = useParams()
  const confirmationSuppression = useDisclosure()
  const [currentOffre, setCurrentOffre] = useState()
  const [auth] = useAuth()
  const toast = useToast()
  const client = useQueryClient()

  dayjs.extend(relativeTime)

  let { data, isLoading } = useQuery("offre-liste", () => getFormulaire(params.establishment_id))

  if (isLoading) {
    return <LoadingEmptySpace label="Chargement en cours..." />
  }

  const getUserNavigationContext = ({ establishment_siret, establishment_id }) => {
    switch (auth.type) {
      case AUTHTYPE.OPCO:
        return `/administration/opco/entreprise/${establishment_siret}/${establishment_id}/offre/creation`
      default:
        return `/administration/entreprise/${establishment_id}/offre/creation`
    }
  }

  if (data.data.jobs.length === 0) {
    return (
      <Container maxW="container.xl" my={12}>
        <Flex justify="space-between" align="center">
          <Text fontSize="2rem" fontWeight={700}>
            {data.data.establishment_raison_sociale}
          </Text>
          <Box>
            {auth.type !== AUTHTYPE.OPCO && (
              <Button mr={5} variant="secondary" leftIcon={<Building />} onClick={() => navigate(`/administration/entreprise/${data.data.establishment_id}/edition`)}>
                Modifier l'entreprise
              </Button>
            )}
            <Button
              variant="primary"
              leftIcon={<Plus />}
              onClick={() => {
                navigate(getUserNavigationContext(data.data), {
                  state: { establishment_raison_sociale: data.data.establishment_raison_sociale },
                })
              }}
            >
              Ajouter une offre
            </Button>
          </Box>
        </Flex>
        <EmptySpace />
      </Container>
    )
  }

  const jobs = data.data?.jobs?.map((job) => ({ ...job, geo_coordinates: data.data.geo_coordinates })) ?? []

  const offresTermine = jobs.filter((x) => x.job_status === "Annulée")
  const offresTermineNbr = offresTermine.length
  const offresActive = jobs.filter((x) => x.job_status === "Active")
  const offresActiveNbr = offresActive.length
  const offresPourvue = jobs.filter((x) => x.job_status === "Pourvue")
  const offresPourvueNbr = offresPourvue.length

  const columns = [
    {
      Header: "Métier",
      accessor: "rome_label",
      Cell: ({
        data,
        cell: {
          row: { id },
        },
      }) => {
        const { rome_label, rome_appellation_label } = data[id]
        return rome_appellation_label ?? rome_label
      },
      width: "500",
      maxWidth: "500",
    },
    {
      Header: "Postée le",
      id: "job_creation_date",
      sortType: (a, b) => sortReactTableDate(a.original.job_creation_date, b.original.job_creation_date),
      accessor: ({ job_creation_date }) => dayjs(job_creation_date).format("DD/MM/YYYY"),
    },
    {
      Header: "Expire dans",
      id: "job_expiration_date",
      sortType: (a, b) => sortReactTableDate(a.original.job_expiration_date, b.original.job_expiration_date),
      accessor: ({ job_expiration_date }) => dayjs(new Date()).to(job_expiration_date, true),
    },
    {
      Header: "Recherches",
      id: "searches",
      width: "150",
      accessor: (row) => {
        return <NumberCell>0</NumberCell>
      },
    },
    {
      Header: "Vues",
      id: "views",
      width: "90",
      accessor: (row) => {
        console.log(row)
        return <NumberCell>0</NumberCell>
      },
    },
    {
      Header: "Candidat(s)",
      id: "candidat",
      width: "150",
      accessor: (row) => <NumberCell>{row.candidatures ?? 0}</NumberCell>,
    },
    {
      Header: "",
      id: "action",
      maxWidth: "50",
      disableFilters: true,
      disableSortBy: true,
      accessor: (row) => {
        const [lat, lon] = row.geo_coordinates.split(",")
        const isDisable = row.job_status === "Annulée" || row.job_status === "Pourvue" ? true : false

        return (
          <Box display={["none", isDisable ? "none" : "block"]}>
            <Menu>
              {({ isOpen }) => (
                <>
                  <MenuButton isActive={isOpen} as={Button} variant="navdot" _hover={{ backgroundColor: "none" }}>
                    <Icon as={Parametre} color="bluefrance.500" />
                  </MenuButton>
                  <MenuList>
                    <MenuItem>
                      <Link
                        onClick={() =>
                          navigate(`/administration/entreprise/${params.establishment_id}/offre/${row._id}`, {
                            state: { establishment_raison_sociale: data.data.establishment_raison_sociale },
                          })
                        }
                      >
                        Editer l'offre
                      </Link>
                    </MenuItem>
                    <MenuItem>
                      <Link
                        onClick={() => {
                          putOffre(row._id, {
                            ...row,
                            job_expiration_date: dayjs().add(1, "month").format("YYYY-MM-DD"),
                            job_last_prolongation_date: Date(),
                            job_prolongation_count: row.job_prolongation_count >= 0 ? row.job_prolongation_count + 1 : 1,
                          })
                            .then(() =>
                              toast({
                                title: "Offre prolongée d'un mois.",
                                position: "top-right",
                                status: "success",
                                duration: 2000,
                                isClosable: true,
                              })
                            )
                            .finally(() => client.invalidateQueries("offre-liste"))
                        }}
                      >
                        Prolonger l'offre
                      </Link>
                    </MenuItem>
                    <MenuItem>
                      <Link isExternal href={`${process.env.REACT_APP_BASE_URL}/recherche-apprentissage?&type=matcha&itemId=${row._id}`}>
                        Voir l'offre en ligne
                        <ExternalLinkLine ml={1} color="bluefrance.500" />
                      </Link>
                    </MenuItem>
                    {auth.type !== AUTHTYPE.CFA && (
                      <>
                        <MenuItem>
                          <Link isExternal href={`${process.env.REACT_APP_BASE_URL}/recherche-apprentissage-formation?&caller=matcha&romes=${row.rome_code}&lon=${lon}&lat=${lat}`}>
                            Voir les centres de formations
                          </Link>
                        </MenuItem>
                      </>
                    )}
                    <MenuItem>
                      <Link
                        onClick={() => {
                          confirmationSuppression.onOpen()
                          setCurrentOffre(row)
                        }}
                      >
                        Supprimer l'offre
                      </Link>
                    </MenuItem>
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
    <Container maxW="container.xl" my={5}>
      <ConfirmationSuppressionOffre {...confirmationSuppression} offre={currentOffre} />
      <Box mb={5}>
        <Breadcrumb separator={<ArrowDropRightLine color="grey.600" />} textStyle="xs">
          {auth.type === AUTHTYPE.OPCO && (
            <Breadcrumb separator={<ArrowDropRightLine color="grey.600" />} textStyle="xs">
              <BreadcrumbItem>
                <BreadcrumbLink textDecoration="underline" onClick={() => navigate("/administration/opco")} textStyle="xs">
                  Entreprises
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbItem>
                <BreadcrumbLink textStyle="xs">{data.data.establishment_raison_sociale}</BreadcrumbLink>
              </BreadcrumbItem>
            </Breadcrumb>
          )}
          {auth.sub !== "anonymous" && auth.type !== AUTHTYPE.ENTREPRISE && auth.type !== AUTHTYPE.OPCO && (
            <Breadcrumb separator={<ArrowDropRightLine color="grey.600" />} textStyle="xs">
              <BreadcrumbItem>
                <BreadcrumbLink textDecoration="underline" onClick={() => navigate(-1)} textStyle="xs">
                  Administration des offres
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbItem>
                {data.data._id ? (
                  <BreadcrumbLink textStyle="xs">{data.data.establishment_raison_sociale}</BreadcrumbLink>
                ) : (
                  <BreadcrumbLink textStyle="xs">Nouvelle entreprise</BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </Breadcrumb>
          )}
        </Breadcrumb>
      </Box>
      <Flex justify="space-between" align="center">
        <Text fontSize="2rem" fontWeight={700}>
          {data.data.establishment_raison_sociale}
        </Text>
        <Box>
          {auth.type !== AUTHTYPE.OPCO && (
            <Button mr={5} variant="secondary" leftIcon={<Building />} onClick={() => navigate(`/administration/entreprise/${data.data.establishment_id}/edition`)}>
              {auth.type === AUTHTYPE.ENTREPRISE ? "Mes informations" : "Modifier l'entreprise"}
            </Button>
          )}
          <Button
            variant="primary"
            leftIcon={<Plus />}
            onClick={() =>
              navigate(getUserNavigationContext(data.data), {
                state: { establishment_raison_sociale: data.data.establishment_raison_sociale },
              })
            }
          >
            Ajouter une offre
          </Button>
        </Box>
      </Flex>
      <Text fontWeight="700" py={6}>
        Offres de recrutement en alternance
      </Text>
      <Tabs variant="search" isLazy>
        <TabList>
          <Tab width="300px">En cours ({offresActiveNbr})</Tab>
          <Tab width="300px" isDisabled={offresPourvueNbr === 0 ? true : false}>
            Pourvue ({offresPourvueNbr})
          </Tab>
          <Tab width="300px" isDisabled={offresTermineNbr === 0 ? true : false}>
            Expirée ({offresTermineNbr})
          </Tab>
        </TabList>
        <TabPanels>
          <TabPanel>
            <Table columns={columns} data={offresActive} />
          </TabPanel>
          <TabPanel>
            <Table columns={columns} data={offresPourvue} />
          </TabPanel>
          <TabPanel>
            <Table columns={columns} data={offresTermine} />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Container>
  )
}

export default ListeOffres
