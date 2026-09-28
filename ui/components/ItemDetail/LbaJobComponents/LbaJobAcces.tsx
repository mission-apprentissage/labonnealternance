import Accordion from "@codegouvfr/react-dsfr/Accordion"
import { Typography } from "@mui/material"
import type { ILbaItemPartnerJobJson } from "shared"

const LbaJobAcces = ({ job }: { job: ILbaItemPartnerJobJson }) => {
  const accesEmploi = job?.job.offer_access_conditions
  if (!accesEmploi?.length) return null
  return (
    <Accordion label="À qui ce métier est-il accessible ?">
      {accesEmploi.map((condition, idx) => (
        <Typography key={idx}>{condition}</Typography>
      ))}
    </Accordion>
  )
}

export default LbaJobAcces
