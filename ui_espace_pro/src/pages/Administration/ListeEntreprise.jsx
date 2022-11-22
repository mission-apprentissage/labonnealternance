import { DataSearch, ReactiveBase, ReactiveList, StateProvider } from "@appbaseio/reactivesearch"
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
  Text,
  useDisclosure,
  useToast,
} from "@chakra-ui/react"
import dayjs from "dayjs"
import { memo, useEffect, useState } from "react"
import { NavLink, useLocation, useNavigate } from "react-router-dom"
import addOfferImage from "../../assets/images/add-offer.svg"
import useAuth from "../../common/hooks/useAuth"
import { sortReactTableDate, sortReactTableString } from "../../common/utils/dateUtils"
import { AnimationContainer, ConfirmationSuppressionEntreprise, Pagination, Table } from "../../components"
import ExportButton from "../../components/ExportButton/ExportButton"
import { Parametre } from "../../theme/components/icons"
import constants from "./reactiveSearchConfig"
import "./search.css"

const EmptySpace = () => (
  <Stack direction={["column", "column", "column", "row"]} mt={12} pt={12} py={8} border="1px solid" borderColor="grey.400" spacing="32px">
    <Flex justify={["center", "center", "center", "flex-end"]} align={["center", "center", "center", "flex-start"]} w={["100%", "100%", "100%", "350px"]} h="150px">
      <Image src={addOfferImage} />
    </Flex>

    <Box w={["100%", "100%", "100%", "600px"]}>
      <Heading fontSize="2rem" pb={7}>
        Créer votre première entreprise mandatée.
      </Heading>
      <Text fontSize="1.375rem">Une entreprise vous a mandaté pour gérer ses offres d’emploi ?</Text>
      <Text fontSize="1.375rem">
        En quelques secondes, exprimez les besoins de recrutement de cette entreprise pour les afficher sur le site <span style={{ fontWeight: "700" }}>La Bonne Alternance</span>{" "}
        dès aujourd’hui.
      </Text>
    </Box>
  </Stack>
)

export default memo(() => {
  const [currentEntreprise, setCurrentEntreprise] = useState()
  const confirmationSuppression = useDisclosure()
  const location = useLocation()
  const navigate = useNavigate()
  const [auth] = useAuth()
  const toast = useToast()
  const { dataSearchDefinition, exportableColumns } = constants

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

  const queryFilter = () => {
    if (auth.scope === "all") return {}

    if (auth.siret == undefined) {
      return {
        query: {
          bool: {
            must: {
              match_phrase_prefix: {
                origine: auth.scope,
              },
            },
            filter: [
              {
                match: {
                  statut: "Actif",
                },
              },
            ],
          },
        },
      }
    }

    return {
      query: {
        bool: {
          must: {
            match: {
              gestionnaire: auth.gestionnaire,
            },
          },
          filter: [
            {
              match: {
                statut: "Actif",
              },
            },
          ],
        },
      },
    }
  }

  const columns = [
    {
      Header: "ENTREPRISES",
      id: "raison_sociale",
      width: "500",
      maxWidth: "500",
      sortType: (a, b) => sortReactTableString(a.original.raison_sociale, b.original.raison_sociale),
      accessor: ({ id_form, raison_sociale }) => (
        <Link as={NavLink} to={`/administration/entreprise/${id_form}`}>
          {raison_sociale}
        </Link>
      ),
    },
    {
      Header: "Ajoutée le",
      accessor: ({ createdAt }) => dayjs(createdAt).format("DD/MM/YYYY"),
      id: "createdAt",
      sortType: (a, b) => sortReactTableDate(a.original.createdAt, b.original.createdAt),
    },
    {
      Header: "Offres",
      id: "nombre_offres",
      sortType: "basic",
      accessor: ({ offres }) => offres.length,
    },
    {
      Header: "Dernière offre créée le",
      id: "date_creation_offre",
      disableSortBy: true,
      width: "225",
      accessor: ({ offres }) => {
        if (offres.length > 0) {
          let last = offres.pop()
          return dayjs(last.date_creation).format("DD/MM/YYYY")
        } else {
          return ""
        }
      },
    },
    {
      Header: "",
      id: "action",
      maxWidth: "50",
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
                      <Link as={NavLink} to={`/administration/entreprise/${row.id_form}`}>
                        Voir les offres
                      </Link>
                    </MenuItem>
                    <MenuItem>
                      <Link
                        onClick={() => {
                          confirmationSuppression.onOpen()
                          setCurrentEntreprise(row)
                        }}
                      >
                        Supprimer l'entreprise
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
    <AnimationContainer>
      <ConfirmationSuppressionEntreprise {...confirmationSuppression} {...currentEntreprise} />
      <Container maxW="container.xl" mt={5}>
        <Box mb={5}>
          <Breadcrumb spacing="4px" textStyle="xs">
            <BreadcrumbItem isCurrentPage>
              <BreadcrumbLink href="#" textStyle="xs">
                Administration des offres
              </BreadcrumbLink>
            </BreadcrumbItem>
          </Breadcrumb>
        </Box>
        <div className="search-page">
          <ReactiveBase url={`${process.env.REACT_APP_BASE_URL}/es/search`} app="formulaires" theme={{ typography: { fontFamily: "Marianne" } }}>
            <Flex justify="space-between" mb={12}>
              <Text fontSize="2rem" fontWeight={700}>
                Mes entreprises
              </Text>
              <Button variant="primary" size="sm" mr={3} onClick={() => navigate(`/administration/entreprise`)}>
                Nouvelle entreprise
              </Button>
            </Flex>

            <div className="search-container">
              <StateProvider
                render={({ searchState }) => {
                  if (!searchState.resultsFormulaire?.isLoading && searchState.resultsFormulaire?.hits?.total > 0) {
                    return <DataSearch {...dataSearchDefinition} defaultQuery={queryFilter} URLParams={true} />
                  } else {
                    return ""
                  }
                }}
              />
            </div>

            <ReactiveList
              componentId="resultsFormulaire"
              dataField="_id"
              innerClass={{ pagination: "search-pagination" }}
              loader="Chargement des résultats.."
              excludeFields={["events", "mailing"]}
              react={{
                and: ["searchFormulaire"],
              }}
              defaultQuery={queryFilter}
              scrollOnChange={false}
              pagination={true}
              URLParams={true}
              size={10}
              sortBy="desc"
              renderNoResults={() => {
                return <EmptySpace />
              }}
              renderResultStats={(stats) => {
                return (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      flexGrow: "1",
                      marginBottom: "15px",
                    }}
                  >
                    <Text fontSize="sm">
                      {stats.displayedResults} entreprises sur {stats.numberOfResults}
                    </Text>
                    <ExportButton
                      index="formulaires"
                      filters={["searchFormulaire"]}
                      defaultQuery={queryFilter}
                      columns={exportableColumns.filter((c) => c.exportable).map((c) => ({ header: c.Header, fieldName: c.accessor, formatter: c.formatter }))}
                    />
                  </div>
                )
              }}
              render={({ loading, data }) => {
                if (loading) return "Chargement en cours..."

                if (!data.length) {
                  return <EmptySpace />
                }

                if (data.length > 0) {
                  return <Table data={data} columns={columns} />
                }

                return null
              }}
              renderPagination={(props) => <Pagination {...props} />}
            />
          </ReactiveBase>
        </div>
      </Container>
    </AnimationContainer>
  )
})
