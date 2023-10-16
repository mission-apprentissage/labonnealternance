import { Button, Link } from "@chakra-ui/react"
import dayjs from "dayjs"
import _ from "lodash"
import { CSVLink } from "react-csv"

import { useAuth } from "@/context/UserContext"

import { AUTHTYPE } from "../../../common/contants"
import { DownloadLine } from "../../../theme/components/icons"

const formatDate = (date) => dayjs(date).format("YYYY-MM-DD")

export default function ExportButtonNew({ data, datasetName = "export" }) {
  /** Map et reduce data per offre */

  const { user } = useAuth()

  const buffer = []

  if (user.type === AUTHTYPE.OPCO) {
    data.forEach((e) => {
      if (e.job_detail?.length) {
        e.job_detail.forEach((job) => {
          buffer.push({ ...e, ...job })
        })
      } else {
        buffer.push(e)
      }
    })
  }

  const format = buffer
    .flat()
    .map((x) =>
      _.omit(x, ["_id", "status", "__v", "type", "scope", "is_email_checked", "establishment_id", "job_detail", "is_qualiopi", "address_detail", "delegations", "rome_detail"])
    )
    .map((x) => {
      return {
        ...x,
        createdAt: formatDate(x.createdAt),
        updatedAt: formatDate(x.updatedAt),
        date_debut_apprentissage: formatDate(x.job_start_date),
        date_creation: formatDate(x.job_creation_date),
        date_expiration: formatDate(x.job_expiration_date),
        date_mise_a_jour: formatDate(x.job_update_date),
        date_derniere_prolongation: formatDate(x.job_last_prolongation_date),
      }
    })
    .map((x) => {
      return {
        ...x,
        // @ts-expect-error: TODO
        establishment_siret: `"${x.establishment_siret}"`,
        // @ts-expect-error: TODO
        phone: `"${x.phone}"`,
        // @ts-expect-error: TODO
        job_description: x?.job_description ? x.job_description.replace(/(\n|\r|[,.!?;:'-])/g, " ") : undefined,
      }
    })

  const fileName = `${datasetName}_${new Date().toJSON()}.csv`

  return (
    <Link>
      <CSVLink data={format} filename={fileName} separator={";"}>
        <Button variant="pill" py={2}>
          <DownloadLine mx="0.5rem" w="0.75rem" h="0.75rem" />
          Exporter
        </Button>
      </CSVLink>
    </Link>
  )
}
