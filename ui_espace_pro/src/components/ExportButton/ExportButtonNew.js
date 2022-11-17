import { Button, Link } from "@chakra-ui/react"
import dayjs from "dayjs"
import _ from "lodash"
import { CSVLink } from "react-csv"
import { AUTHTYPE } from "../../common/contants"
import useAuth from "../../common/hooks/useAuth"
import { DownloadLine } from "../../theme/components/icons"

const formatDate = (date) => dayjs(date).format("YYYY-MM-DD")

export default ({ data, datasetName = "export" }) => {
  /** Map et reduce data per offre */

  const [auth] = useAuth()

  const buffer = []

  if (auth.type === AUTHTYPE.OPCO) {
    data.forEach((e) => {
      if (e.offres_detail.length > 0) {
        e.offres_detail.map((offre) => {
          buffer.push({ ...e, ...offre })
        })
      } else {
        buffer.push(e)
      }
    })
  }

  const format = buffer
    .flat()
    .map((x) => _.omit(x, ["_id", "etat_utilisateur", "__v", "isAdmin", "type", "scope", "email_valide", "id_form", "offres_detail", "qualiopi"]))
    .map((x) => {
      return {
        ...x,
        createdAt: formatDate(x.createdAt),
        updatedAt: formatDate(x.updatedAt),
        date_debut_apprentissage: formatDate(x.date_debut_apprentissage),
        date_creation: formatDate(x.date_creation),
        date_expiration: formatDate(x.date_expiration),
        date_mise_a_jour: formatDate(x.date_mise_a_jour),
        date_derniere_prolongation: formatDate(x.date_derniere_prolongation),
      }
    })
    .map((x) => {
      return { ...x, siret: `"${x.siret}"`, telephone: `"${x.telephone}"` }
    })
  let fileName = `${datasetName}_${new Date().toJSON()}.csv`

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
