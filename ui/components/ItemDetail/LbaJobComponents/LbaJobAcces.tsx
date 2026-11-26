import Accordion from "@codegouvfr/react-dsfr/Accordion"
import { Box, Typography } from "@mui/material"
import type { ILbaItemPartnerJobJson } from "shared"

const LbaJobAcces = ({ job }: { job: ILbaItemPartnerJobJson }) => {
  const accesEmploi = job?.job.offer_access_conditions
  if (!accesEmploi?.length) return null
  return (
    <Accordion label="À qui ce métier est-il accessible ?">
      <Box component="ul" className="fr-raw-list">
        {accesEmploi.map((condition, idx) => (
          <Typography component="li" key={idx}>
            {condition}
          </Typography>
        ))}
      </Box>
    </Accordion>
  )
}

export default LbaJobAcces
