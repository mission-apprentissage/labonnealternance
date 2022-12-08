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

export default () => {
  const navigate = useNavigate()
  const params = useParams()
  const confirmationSuppression = useDisclosure()
  const [currentOffre, setCurrentOffre] = useState()
  const [auth] = useAuth()
  const toast = useToast()
  const client = useQueryClient()

  dayjs.extend(relativeTime)

  let { data, isLoading } = useQuery("offre-liste", () => getFormulaire(params.id_form))

  if (isLoading) {
    return <LoadingEmptySpace label="Chargement en cours..." />
  }

  const getUserNavigationContext = ({ siret, id_form }) => {
    switch (auth.type) {
      case AUTHTYPE.OPCO:
        return `/administration/opco/entreprise/${siret}/${id_form}/offre/creation`
      default:
        return `/administration/entreprise/${data.data.id_form}/offre/creation`
    }
  }

  if (data.data.offres.length === 0) {
    return (
      <Container maxW="container.xl" my={12}>
        <Flex justify="space-between" align="center">
          <Text fontSize="2rem" fontWeight={700}>
            {data.data.raison_sociale}
          </Text>
          <Box>
            {auth.type !== AUTHTYPE.OPCO && (
              <Button mr={5} variant="secondary" leftIcon={<Building />} onClick={() => navigate(`/administration/entreprise/${data.data.id_form}/edition`)}>
                Modifier l'entreprise
              </Button>
            )}
            <Button
              variant="primary"
              leftIcon={<Plus />}
              onClick={() => {
                navigate(getUserNavigationContext(data.data), {
                  state: { raison_sociale: data.data.raison_sociale },
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

  const offres = data.data?.offres?.map((offre) => ({ ...offre, geo_coordonnees: data.data.geo_coordonnees }))

  const offresTermine = offres.filter((x) => x.statut === "Annulée")
  const offresTermineNbr = offres.filter((x) => x.statut === "Annulée").length
  const offresActive = offres.filter((x) => x.statut === "Active")
  const offresActiveNbr = offres.filter((x) => x.statut === "Active").length
  const offresPourvue = offres.filter((x) => x.statut === "Pourvue")
  const offresPourvueNbr = offres.filter((x) => x.statut === "Pourvue").length

  const columns = [
    {
      Header: "Métier",
      accessor: "libelle",
      Cell: ({
        data,
        cell: {
          row: { id },
        },
      }) => {
        const { libelle, rome_appellation_label } = data[id]
        return rome_appellation_label ?? libelle
      },
      width: "500",
      maxWidth: "500",
    },
    {
      Header: "Postée le",
      id: "createdAt",
      sortType: (a, b) => sortReactTableDate(a.original.date_creation, b.original.date_creation),
      accessor: ({ date_creation }) => dayjs(date_creation).format("DD/MM/YYYY"),
    },
    {
      Header: "Expire dans",
      id: "date_expiration",
      sortType: (a, b) => sortReactTableDate(a.original.date_expiration, b.original.date_expiration),
      accessor: ({ date_expiration }) => dayjs(new Date()).to(date_expiration, true),
    },
    {
      Header: "Candidat(s)",
      id: "candidat",
      width: "225",
      accessor: (row) => {
        if (row.candidatures && row.candidatures > 0) {
          return row.candidatures
        } else {
          return 0
        }
      },
    },
    {
      Header: "",
      id: "action",
      maxWidth: "50",
      disableFilters: true,
      disableSortBy: true,
      accessor: (row) => {
        const [lat, lon] = row.geo_coordonnees.split(",")
        const isDisable = row.statut === "Annulée" || row.statut === "Pourvue" ? true : false

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
                          navigate(`/administration/entreprise/${params.id_form}/offre/${row._id}`, {
                            state: { raison_sociale: data.data.raison_sociale },
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
                            date_expiration: dayjs().add(1, "month").format("YYYY-MM-DD"),
                            date_derniere_prolongation: Date(),
                            nombre_prolongation: row.nombre_prolongation >= 0 ? row.nombre_prolongation + 1 : 1,
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
                      <Link
                        isExternal
                        href={`https://labonnealternance${
                          window.location.href.includes("recette") ? "-recette" : ""
                        }.apprentissage.beta.gouv.fr/recherche-apprentissage?&type=matcha&itemId=${row._id}`}
                      >
                        Voir l'offre en ligne
                        <ExternalLinkLine ml={1} color="bluefrance.500" />
                      </Link>
                    </MenuItem>
                    {auth.type !== AUTHTYPE.CFA && (
                      <>
                        <MenuItem>
                          <Link
                            isExternal
                            href={`https://labonnealternance.apprentissage.beta.gouv.fr/recherche-apprentissage-formation?&caller=matcha&romes=${row.romes}&lon=${lon}&lat=${lat}`}
                          >
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
                <BreadcrumbLink textStyle="xs">{data.data.raison_sociale}</BreadcrumbLink>
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
                {data.data._id ? <BreadcrumbLink textStyle="xs">{data.data.raison_sociale}</BreadcrumbLink> : <BreadcrumbLink textStyle="xs">Nouvelle entreprise</BreadcrumbLink>}
              </BreadcrumbItem>
            </Breadcrumb>
          )}
        </Breadcrumb>
      </Box>
      <Flex justify="space-between" align="center">
        <Text fontSize="2rem" fontWeight={700}>
          {data.data.raison_sociale}
        </Text>
        <Box>
          {auth.type !== AUTHTYPE.OPCO && (
            <Button mr={5} variant="secondary" leftIcon={<Building />} onClick={() => navigate(`/administration/entreprise/${data.data.id_form}/edition`)}>
              {auth.type === AUTHTYPE.ENTREPRISE ? "Mes informations" : "Modifier l'entreprise"}
            </Button>
          )}
          <Button
            variant="primary"
            leftIcon={<Plus />}
            onClick={() =>
              navigate(getUserNavigationContext(data.data), {
                state: { raison_sociale: data.data.raison_sociale },
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
