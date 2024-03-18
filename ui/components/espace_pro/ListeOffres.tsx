import { ExternalLinkIcon } from "@chakra-ui/icons"
import {
  Badge,
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
import { useRouter } from "next/router"
import { useState } from "react"
import { useQuery, useQueryClient } from "react-query"
import { IJob } from "shared"
import { LBA_ITEM_TYPE_OLD } from "shared/constants/lbaitem"

import { useAuth } from "@/context/UserContext"

import { AUTHTYPE } from "../../common/contants"
import { sortReactTableDate } from "../../common/utils/dateUtils"
import { publicConfig } from "../../config.public"
import { ArrowDropRightLine, Building, ExternalLinkLine, Parametre, Plus } from "../../theme/components/icons"
import { extendOffre, getFormulaire } from "../../utils/api"

import { ConfirmationSuppressionOffre, LoadingEmptySpace, Table } from "."

const EmptySpace = () => (
  <Stack direction={["column", "column", "column", "row"]} mt={12} pt={12} py={8} border="1px solid" borderColor="grey.400" spacing="32px">
    <Flex justify={["center", "center", "center", "flex-end"]} align={["center", "center", "center", "flex-start"]} w={["100%", "100%", "100%", "350px"]} h="150px">
      {/* eslint-disable-next-line jsx-a11y/alt-text */}
      <Image src="/images/espace_pro/add-offer.svg" />
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
      <Badge colorScheme="blue">{children}</Badge>
    </Box>
  )
}

export default function ListeOffres() {
  const router = useRouter()
  const confirmationSuppression = useDisclosure()
  const [currentOffre, setCurrentOffre] = useState()
  const { user } = useAuth()
  const toast = useToast()
  const client = useQueryClient()

  dayjs.extend(relativeTime)

  const { establishment_id } = router.query as { establishment_id: string }
  const { data, isLoading } = useQuery("offre-liste", {
    enabled: !!establishment_id,
    queryFn: () => getFormulaire(establishment_id),
  })

  if (isLoading || !establishment_id) {
    return <LoadingEmptySpace label="Chargement en cours..." />
  }

  const { establishment_raison_sociale, establishment_siret, geo_coordinates, _id: dataId } = data
  const jobs: (IJob & { candidatures: number })[] = data.jobs ?? []

  const entrepriseTitle = establishment_raison_sociale ?? establishment_siret
  const getOffreCreationUrl = () => {
    switch (user.type) {
      case AUTHTYPE.OPCO:
        return `/espace-pro/administration/opco/entreprise/${establishment_siret}/${establishment_id}/offre/creation`
      default:
        return `/espace-pro/administration/entreprise/${establishment_id}/offre/creation`
    }
  }
  const navigateToCreation = () => {
    // navigate(getOffreCreationUrl(), {
    //   state: { raison_sociale: entrepriseTitle },
    // })
    router.push({
      pathname: getOffreCreationUrl(),
      query: { raison_sociale: entrepriseTitle },
    })
  }

  if (jobs.length === 0) {
    return (
      <Container maxW="container.xl" my={12}>
        <Flex justify="space-between" align="center">
          <Text fontSize="2rem" fontWeight={700}>
            {entrepriseTitle}
          </Text>
          <Box>
            {user.type !== AUTHTYPE.OPCO && (
              <Button mr={5} variant="secondary" leftIcon={<Building />} onClick={() => router.push(`/espace-pro/administration/entreprise/${establishment_id}/edition`)}>
                Modifier l'entreprise
              </Button>
            )}
            <Button variant="primary" leftIcon={<Plus />} onClick={navigateToCreation}>
              Ajouter une offre
            </Button>
          </Box>
        </Flex>
        <EmptySpace />
      </Container>
    )
  }

  const jobsWithGeoCoords = jobs.map((job) => ({ ...job, geo_coordinates }))

  const offresTermine = jobsWithGeoCoords.filter((x) => x.job_status === "Annulée")
  const offresTermineNbr = offresTermine.length
  const offresActive = jobsWithGeoCoords.filter((x) => x.job_status === "Active")
  const offresActiveNbr = offresActive.length
  const offresPourvue = jobsWithGeoCoords.filter((x) => x.job_status === "Pourvue")
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
      Header: "Expire le",
      id: "job_expiration_date",
      width: "175",
      sortType: (a, b) => sortReactTableDate(a.original.job_expiration_date, b.original.job_expiration_date),
      accessor: ({ job_expiration_date }) => dayjs(job_expiration_date).format("DD/MM/YYYY"),
    },
    {
      Header: "Recherches",
      id: "searches",
      width: "150",
      accessor: ({ stats_search_view = 0 }) => {
        return <NumberCell>{stats_search_view}</NumberCell>
      },
    },
    {
      Header: "Vues",
      id: "views",
      width: "90",
      accessor: ({ stats_detail_view = 0 }) => {
        return <NumberCell>{stats_detail_view}</NumberCell>
      },
    },
    {
      Header: "Candidat(s)",
      id: "candidat",
      width: "150",
      accessor: ({ candidatures = 0 }) => <NumberCell>{Math.max(candidatures, 0)}</NumberCell>,
    },
    {
      Header: "",
      id: "action",
      maxWidth: "50",
      disableFilters: true,
      disableSortBy: true,
      accessor: (row) => {
        const [lat, lon] = (row.geo_coordinates ?? "").split(",")
        const isDisable = row.job_status === "Annulée" || row.job_status === "Pourvue" ? true : false

        return (
          <Box display={["none", isDisable ? "none" : "block"]}>
            <Menu>
              {({ isOpen }) => (
                <>
                  <MenuButton isActive={isOpen} as={Button} variant="navdot">
                    <Icon as={Parametre} color="bluefrance.500" />
                  </MenuButton>
                  <MenuList>
                    <MenuItem>
                      <Link
                        onClick={() =>
                          router.push({
                            pathname: `/espace-pro/administration/entreprise/${router.query.establishment_id}/offre/${row._id}`,
                            query: { establishment_raison_sociale },
                          })
                        }
                      >
                        Editer l'offre
                      </Link>
                    </MenuItem>
                    <MenuItem>
                      <Link
                        onClick={() => {
                          extendOffre(row._id)
                            .then((job) =>
                              toast({
                                title: `Date d'expiration : ${dayjs(job.job_expiration_date).format("DD/MM/YYYY")}`,
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
                      <Link
                        isExternal
                        href={`${publicConfig.baseUrl}/recherche-apprentissage?&type=${LBA_ITEM_TYPE_OLD.MATCHA}&itemId=${row._id}`}
                        aria-label="Lien vers l'offre - nouvelle fenêtre"
                      >
                        Voir l'offre en ligne
                        <ExternalLinkLine ml={1} color="bluefrance.500" />
                      </Link>
                    </MenuItem>
                    {user.type !== AUTHTYPE.CFA && (
                      <MenuItem>
                        <Link
                          isExternal
                          href={`${publicConfig.baseUrl}/recherche-apprentissage-formation?&caller=lba_recruteur&romes=${row.rome_code}&lon=${lon}&lat=${lat}`}
                          aria-label="Lien vers les formations - nouvelle fenêtre"
                        >
                          Voir les centres de formations <ExternalLinkIcon mx="2px" />
                        </Link>
                      </MenuItem>
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
          {user.type === AUTHTYPE.OPCO && (
            <Breadcrumb separator={<ArrowDropRightLine color="grey.600" />} textStyle="xs">
              <BreadcrumbItem>
                <BreadcrumbLink textDecoration="underline" onClick={() => router.push("/espace-pro/administration/opco")} textStyle="xs">
                  Entreprises
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbItem>
                <BreadcrumbLink textStyle="xs">{establishment_raison_sociale}</BreadcrumbLink>
              </BreadcrumbItem>
            </Breadcrumb>
          )}
          {user && user.type !== AUTHTYPE.ENTREPRISE && user.type !== AUTHTYPE.OPCO && (
            <Breadcrumb separator={<ArrowDropRightLine color="grey.600" />} textStyle="xs">
              <BreadcrumbItem>
                <BreadcrumbLink textDecoration="underline" onClick={() => router.back()} textStyle="xs">
                  Administration des offres
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbItem>
                {dataId ? <BreadcrumbLink textStyle="xs">{establishment_raison_sociale}</BreadcrumbLink> : <BreadcrumbLink textStyle="xs">Nouvelle entreprise</BreadcrumbLink>}
              </BreadcrumbItem>
            </Breadcrumb>
          )}
        </Breadcrumb>
      </Box>
      <Flex justify="space-between" align="center">
        <Text fontSize="2rem" fontWeight={700}>
          {establishment_raison_sociale ?? `SIRET ${establishment_siret}`}
        </Text>
        <Box>
          {user.type !== AUTHTYPE.OPCO && (
            <Button mr={5} variant="secondary" leftIcon={<Building />} onClick={() => router.push(`/espace-pro/administration/entreprise/${establishment_id}/edition`)}>
              {user.type === AUTHTYPE.ENTREPRISE ? "Mes informations" : "Modifier l'entreprise"}
            </Button>
          )}
          <Button variant="primary" leftIcon={<Plus />} onClick={navigateToCreation}>
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
