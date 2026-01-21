import { fr } from "@codegouvfr/react-dsfr"
import { Box, Typography } from "@mui/material"
import dayjs from "dayjs"
import Image from "next/image"
import { useState } from "react"
import type { IJobJson, IRecruiterJson } from "shared"
import { JOB_STATUS } from "shared"
import { RECRUITER_STATUS } from "shared/constants/index"

import ConfirmationSuppressionOffre from "./ConfirmationSuppressionOffre"
import { OffresTabsMenu } from "./OffresTabsMenu"
import Badge from "@/app/(espace-pro)/_components/Badge"
import Table from "@/app/(espace-pro)/_components/Table"
import { useDisclosure } from "@/common/hooks/useDisclosure"
import { sortReactTableDate } from "@/common/utils/dateUtils"

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
  caption,
  recruiter,
  showStats = false,
  buildOfferEditionUrl,
}: {
  caption: string
  recruiter: IRecruiterJson
  showStats?: boolean
  buildOfferEditionUrl: (offerId: string) => string
}) => {
  const confirmationSuppression = useDisclosure()
  const [currentOffre, setCurrentOffre] = useState()

  /* @ts-ignore TODO */
  const jobs: (IJobJson & { candidatures: number; geo_coordinates: string })[] = recruiter?.jobs ?? []

  if (jobs.length === 0) {
    return (
      <Box sx={{ py: fr.spacing("3w"), backgroundColor: "#F5F5FE" }}>
        <Box sx={{ display: "flex", width: "fit-content", m: "auto", alignItems: "center" }}>
          <Image src="/images/espace_pro/no-job.svg" alt="" aria-hidden={true} width="118" height="70" />
          <Typography component="span" ml={fr.spacing("1w")} fontWeight={700} color="#161616">
            Aucune offre déposée
          </Typography>
        </Box>
      </Box>
    )
  }

  const jobsWithGeoCoords = jobs.map((job) => ({ ...job, geo_coordinates: recruiter.geo_coordinates }))

  const openSuppression = (row) => {
    setCurrentOffre(row)
    confirmationSuppression.onOpen()
  }

  const commonColumns = [
    {
      Header: "Métier",
      id: "job_title",
      accessor: "rome_label",
      Cell: ({
        data,
        cell: {
          row: { id },
        },
      }) => {
        const { rome_label, rome_appellation_label, offer_title_custom } = data[id]
        return offer_title_custom ?? rome_appellation_label ?? rome_label
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
          Header: "Candidats",
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
      srOnly: "Actions sur les offres",
      disableFilters: true,
      disableSortBy: true,
      // isSticky: true,
      accessor: (row) => {
        return <OffresTabsMenu openSuppression={openSuppression} buildOfferEditionUrl={buildOfferEditionUrl} row={row} />
      },
    },
    ...commonColumns,
    ...statsColumns,
  ]

  return (
    <>
      <ConfirmationSuppressionOffre {...confirmationSuppression} offre={currentOffre} />
      <Table caption={caption} columns={columns} data={jobsWithGeoCoords} />
    </>
  )
}

const NumberCell = ({ children }) => {
  return (
    <Typography component="span" sx={{ textAlign: "right", width: "100%", pr: fr.spacing("4v") }}>
      <Badge variant="stat_number">{children}</Badge>
    </Typography>
  )
}
