import { Badge, Box, Button, Flex, Icon, Image, Menu, MenuButton, MenuItem, MenuList, Text, useDisclosure, useToast } from "@chakra-ui/react"
import { Link } from "@mui/material"
import { useQueryClient } from "@tanstack/react-query"
import dayjs from "dayjs"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { IJobJson, IRecruiterJson, JOB_STATUS } from "shared"
import { AUTHTYPE, RECRUITER_STATUS } from "shared/constants/index"
import { LBA_ITEM_TYPE } from "shared/constants/lbaitem"
import { buildJobUrl } from "shared/metier/lbaitemutils"

import Table from "@/app/(espace-pro)/_components/Table"
import ConfirmationSuppressionOffre from "@/app/(espace-pro)/espace-pro/(connected)/_components/ConfirmationSuppressionOffre"
import { sortReactTableDate } from "@/common/utils/dateUtils"
import { publicConfig } from "@/config.public"
import { useAuth } from "@/context/UserContext"
import { Parametre } from "@/theme/components/icons"
import { extendOffre } from "@/utils/api"

const displayJobStatus = (status: JOB_STATUS, recruiter: IRecruiterJson) => {
  if (recruiter.status === RECRUITER_STATUS.EN_ATTENTE_VALIDATION) {
    return (
      <Badge variant="awaiting" textTransform="uppercase">
        {RECRUITER_STATUS.EN_ATTENTE_VALIDATION}
      </Badge>
    )
  }
  if (recruiter.status === RECRUITER_STATUS.ARCHIVE) {
    return (
      <Badge variant="inactive" textTransform="uppercase">
        EXPIREE
      </Badge>
    )
  }
  switch (status) {
    case JOB_STATUS.ACTIVE:
      return (
        <Badge variant="neutral" textTransform="uppercase">
          {JOB_STATUS.ACTIVE}
        </Badge>
      )
    case JOB_STATUS.POURVUE:
      return (
        <Badge variant="active" textTransform="uppercase">
          {JOB_STATUS.POURVUE}
        </Badge>
      )
    case JOB_STATUS.ANNULEE:
      return (
        <Badge variant="inactive" textTransform="uppercase">
          EXPIREE
        </Badge>
      )
    case JOB_STATUS.EN_ATTENTE:
      return (
        <Badge variant="awaiting" whiteSpace="normal" textTransform="uppercase">
          {RECRUITER_STATUS.EN_ATTENTE_VALIDATION}
        </Badge>
      )
    default:
      return null
  }
}

export const OffresTabs = ({
  recruiter,
  showStats = false,
  buildOfferEditionUrl,
}: {
  recruiter: IRecruiterJson
  showStats?: boolean
  buildOfferEditionUrl: (offerId: string) => string
}) => {
  const router = useRouter()
  const toast = useToast()
  const client = useQueryClient()
  const { user } = useAuth()
  const confirmationSuppression = useDisclosure()
  const [currentOffre, setCurrentOffre] = useState()
  const [copied, setCopied] = useState(false)

  /* @ts-ignore TODO */
  const jobs: (IJobJson & { candidatures: number; geo_coordinates: string })[] = recruiter?.jobs ?? []

  if (jobs.length === 0) {
    return (
      <Box py={6} backgroundColor="bluefrance.250">
        <Flex width="fit-content" m="auto" alignItems="center">
          <Image src="/images/espace_pro/no-job.svg" alt="" aria-hidden={true} />
          <Text ml={2} fontWeight={700} color="#161616" as="span">
            Aucune offre déposée
          </Text>
        </Flex>
      </Box>
    )
  }

  const jobsWithGeoCoords = jobs.map((job) => ({ ...job, geo_coordinates: recruiter.geo_coordinates }))

  const commonColumns = [
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
      width: "300",
      maxWidth: "300",
    },
    {
      Header: "Statut",
      id: "job_status",
      sortType: (a, b) => sortReactTableDate(a.original.job_status, b.original.job_status),
      accessor: ({ job_status }) => displayJobStatus(job_status, recruiter),
      width: "150",
      maxWidth: "150",
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
  ]
  const statsColumns = showStats
    ? [
        {
          Header: "Recherches",
          id: "searches",
          width: "170",
          accessor: ({ stats_search_view = 0 }) => {
            return <NumberCell>{stats_search_view}</NumberCell>
          },
        },
        {
          Header: "Vues",
          id: "views",
          width: "120",
          accessor: ({ stats_detail_view = 0 }) => {
            return <NumberCell>{stats_detail_view}</NumberCell>
          },
        },
        {
          Header: "Candidat(s)",
          id: "candidat",
          width: "170",
          accessor: ({ candidatures = 0 }) => <NumberCell>{Math.max(candidatures, 0)}</NumberCell>,
        },
      ]
    : []

  const columns = [
    {
      Header: "",
      id: "action",
      maxWidth: "40",
      disableFilters: true,
      disableSortBy: true,
      // isSticky: true,
      accessor: (row) => {
        const [lat, lon] = (row.geo_coordinates ?? "").split(",")
        const directLink = `${publicConfig.baseUrl}${buildJobUrl(LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA, row._id, row.rome_appellation_label)}`
        const isDisable = row.job_status === "Annulée" || row.job_status === "Pourvue" || row.job_status === "En attente"
        return (
          <Box display={isDisable ? "none" : "block"}>
            <Menu
              onOpen={() => {
                setCopied(false)
              }}
            >
              {({ isOpen }) => (
                <>
                  <MenuButton isActive={isOpen} as={Button} variant="navdot">
                    <Icon as={Parametre} color="bluefrance.500" />
                  </MenuButton>
                  <MenuList>
                    <MenuItem>
                      <Link component="button" underline="hover" onClick={() => router.push(buildOfferEditionUrl(row._id))}>
                        Editer l'offre
                      </Link>
                    </MenuItem>
                    <MenuItem>
                      <Link
                        component="button"
                        underline="hover"
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
                            .finally(() =>
                              client.invalidateQueries({
                                queryKey: ["offre-liste"],
                              })
                            )
                        }}
                      >
                        Prolonger l'offre
                      </Link>
                    </MenuItem>
                    <MenuItem>
                      <Link underline="hover" target="_blank" rel="noopener noreferrer" href={directLink} aria-label="Lien vers l'offre - nouvelle fenêtre">
                        Voir l'offre en ligne
                      </Link>
                    </MenuItem>
                    {row.job_status !== JOB_STATUS.EN_ATTENTE && (
                      <MenuItem>
                        <Link
                          underline="hover"
                          target="_blank"
                          rel="noopener noreferrer"
                          href={`${publicConfig.baseUrl}/espace-pro/offre/impression/${row._id}`}
                          aria-label="Lien vers la page d'impression de l'offre - nouvelle fenêtre"
                        >
                          Imprimer l'offre
                        </Link>
                      </MenuItem>
                    )}
                    <MenuItem>
                      <Link
                        underline="hover"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          navigator.clipboard.writeText(directLink).then(function () {
                            setCopied(true)
                          })
                        }}
                        component="button"
                        aria-label="Copier le lien de partage de l'offre dans le presse papier"
                      >
                        {copied ? (
                          <Flex>
                            <Image mr={2} src="/images/icons/share_copied_icon.svg" aria-hidden={true} alt="" />
                            <Text mb={0} color="#18753C">
                              Lien copié !
                            </Text>
                          </Flex>
                        ) : (
                          "Partager l'offre"
                        )}
                      </Link>
                    </MenuItem>
                    {user.type !== AUTHTYPE.CFA && (
                      <MenuItem>
                        <Link
                          underline="hover"
                          target="_blank"
                          rel="noopener noreferrer"
                          href={`${publicConfig.baseUrl}/recherche-formation?romes=${row.rome_code}&lon=${lon}&lat=${lat}`}
                          aria-label="Lien vers les formations - nouvelle fenêtre"
                        >
                          Voir les centres de formations
                        </Link>
                      </MenuItem>
                    )}
                    <MenuItem>
                      <Link
                        underline="hover"
                        component="button"
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
    ...commonColumns,
    ...statsColumns,
  ]

  return (
    <>
      <ConfirmationSuppressionOffre {...confirmationSuppression} offre={currentOffre} />
      <Table columns={columns} data={jobsWithGeoCoords} />
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
