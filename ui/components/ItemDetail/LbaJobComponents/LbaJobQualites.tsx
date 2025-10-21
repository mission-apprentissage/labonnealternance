import Accordion from "@codegouvfr/react-dsfr/Accordion"
import { Typography } from "@mui/material"
import { ILbaItemPartnerJobJson } from "shared"

const LbaJobQualites = ({ job }: { job: ILbaItemPartnerJobJson }) => {
  return (
    job?.job?.offer_desired_skills?.length && (
      <Accordion label="Qualités souhaitées pour ce métier">
        {job.job.offer_desired_skills.map((competence, idx) => (
          <div key={idx}>
            <Typography component="span">&bull; {competence}</Typography>
          </div>
        ))}
      </Accordion>
    )
  )
}

export default LbaJobQualites
