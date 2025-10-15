import Accordion from "@codegouvfr/react-dsfr/Accordion"
import { Typography } from "@mui/material"
import { ILbaItemPartnerJobJson } from "shared"

const LbaJobAcces = ({ job }: { job: ILbaItemPartnerJobJson }) => {
  const accesEmploi = job?.job.offer_access_conditions ?? null
  if (!accesEmploi) return null
  return (
    <Accordion label="À qui ce métier est-il accessible ?">
      <Typography component="span">{accesEmploi}</Typography>
    </Accordion>
  )
}

export default LbaJobAcces
