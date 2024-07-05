import { ExternalLinkIcon } from "@chakra-ui/icons"
import { Badge, Box, Button, Icon, Link, Menu, MenuButton, MenuItem, MenuList, Tab, TabList, TabPanel, TabPanels, Tabs, useDisclosure, useToast } from "@chakra-ui/react"
import dayjs from "dayjs"
import { useRouter } from "next/router"
import { useState } from "react"
import { useQueryClient } from "react-query"
import { IJob } from "shared"
import { LBA_ITEM_TYPE_OLD } from "shared/constants/lbaitem"

import { sortReactTableDate } from "@/common/utils/dateUtils"
import { useAuth } from "@/context/UserContext"

import { IRecruiterJson } from "../../../shared/models/recruiter.model"
import { AUTHTYPE } from "../../common/contants"
import { publicConfig } from "../../config.public"
import { ExternalLinkLine, Parametre } from "../../theme/components/icons"
import { extendOffre } from "../../utils/api"

import ConfirmationSuppressionOffre from "./ConfirmationSuppressionOffre"
import Table from "./Table"

export const OffresTabs = ({ recruiter }: { recruiter: IRecruiterJson }) => {
  const router = useRouter()
  const toast = useToast()
  const client = useQueryClient()
  const { user } = useAuth()
  const confirmationSuppression = useDisclosure()
  const [currentOffre, setCurrentOffre] = useState()

  const jobs: (IJob & { candidatures: number; geo_coordinates: string })[] = recruiter?.jobs ?? []

  if (jobs.length === 0) {
    return null
  }

  const jobsWithGeoCoords = jobs.map((job) => ({ ...job, geo_coordinates: recruiter.geo_coordinates }))

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
                            query: { establishment_raison_sociale: recruiter?.establishment_raison_sociale },
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
    <>
      <ConfirmationSuppressionOffre {...confirmationSuppression} offre={currentOffre} />
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
    </>
  )
}

const NumberCell = ({ children }) => {
  return (
    <Box as="span" textAlign="right" w="100%" pr={5}>
      <Badge colorScheme="blue">{children}</Badge>
    </Box>
  )
}
