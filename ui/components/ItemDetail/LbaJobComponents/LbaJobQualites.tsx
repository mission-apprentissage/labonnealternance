import Accordion from "@codegouvfr/react-dsfr/Accordion"
import { Box, Typography } from "@mui/material"
import type { ILbaItemPartnerJobJson } from "shared"

const LbaJobQualites = ({ job }: { job: ILbaItemPartnerJobJson }) => {
  return (
    job?.job?.offer_desired_skills?.length && (
      <Accordion label="Qualités souhaitées pour ce métier">
        <Box component="ul" sx={{ m: 0 }}>
          {job.job.offer_desired_skills.map((competence, idx) => (
            <Typography component="li" key={idx} sx={{ pb: 0 }}>
              {competence}
            </Typography>
          ))}
        </Box>
      </Accordion>
    )
  )
}

export default LbaJobQualites
