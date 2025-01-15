import { Button, Link } from "@chakra-ui/react"
import { stringify } from "csv-stringify/sync"
import dayjs from "dayjs"
import omit from "lodash-es/omit"
import { useMemo } from "react"
import { CSVLink } from "react-csv"

import { useAuth } from "@/context/UserContext"

import { AUTHTYPE } from "../../../common/contants"
import { DownloadLine } from "../../../theme/components/icons"

const formatDate = (date) => dayjs(date).format("YYYY-MM-DD")

export default function ExportButtonNew({ data, datasetName = "export" }) {
  const { user } = useAuth()

  const transformedData = useMemo(() => {
    const buffer = []

    if (user.type === AUTHTYPE.OPCO) {
      data.forEach((entry) => {
        if (entry.job_detail?.length) {
          entry.job_detail.forEach((job) => buffer.push({ ...entry, ...job }))
        } else {
          buffer.push(entry)
        }
      })
    }

    return buffer
  }, [data, user])

  const formattedData = useMemo(() => {
    return transformedData.flat().map((entry) => {
      const formattedEntry = omit(entry, [
        "_id",
        "status",
        "__v",
        "type",
        "scope",
        "is_email_checked",
        "establishment_id",
        "job_detail",
        "is_qualiopi",
        "address_detail",
        "delegations",
        "rome_detail",
      ])

      return {
        ...formattedEntry,
        createdAt: formatDate(entry.createdAt),
        updatedAt: formatDate(entry.updatedAt),
        date_debut_apprentissage: formatDate(entry.job_start_date),
        date_creation: formatDate(entry.job_creation_date),
        date_expiration: formatDate(entry.job_expiration_date),
        date_mise_a_jour: formatDate(entry.job_update_date),
        date_derniere_prolongation: formatDate(entry.job_last_prolongation_date),
        establishment_siret: `'${entry.establishment_siret}'`,
        phone: `'${entry.phone}'`,
        job_description: entry?.job_description ? entry.job_description.replace(/(\n|\r|[,.!?;:'-])/g, " ") : undefined,
      }
    })
  }, [transformedData])

  const csvData = stringify(formattedData, { escape_formulas: true, header: true })
  const fileName = `${datasetName}_${new Date().toJSON()}.csv`

  return (
    <Link>
      <CSVLink data={csvData} filename={fileName}>
        <Button variant="pill" py={2}>
          <DownloadLine mx="0.5rem" w="0.75rem" h="0.75rem" />
          Exporter
        </Button>
      </CSVLink>
    </Link>
  )
}
