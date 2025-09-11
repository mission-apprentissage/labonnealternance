import Accordion from "@codegouvfr/react-dsfr/Accordion"
import { Typography } from "@mui/material"
import { ILbaItemLbaJobJson } from "shared"

const LbaJobAcces = ({ job }: { job: ILbaItemLbaJobJson }) => {
  const accesEmploi = job?.job?.romeDetails?.acces_metier ?? null
  if (!accesEmploi) return null
  return (
    <Accordion label="À qui ce métier est-il accessible ?">
      <Typography component="span">{accesEmploi}</Typography>
    </Accordion>
  )
}

export default LbaJobAcces
