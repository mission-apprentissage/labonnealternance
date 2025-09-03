import Accordion from "@codegouvfr/react-dsfr/Accordion"
import { Box, Typography } from "@mui/material"
import { ILbaItemLbaJobJson } from "shared"

const LbaJobTechniques = ({ job }: { job: ILbaItemLbaJobJson }) => {
  let currentSkillGroup = null

  return (
    job.job.offer_to_be_acquired_knowledge?.length && (
      <Accordion label="Domaines et techniques de travail">
        {job.job.offer_to_be_acquired_knowledge.map((competence, idx) => {
          const [group, skill] = competence.split("\t")
          let title = <></>

          if (group !== currentSkillGroup) {
            currentSkillGroup = group
            title = (
              <Typography component="span" sx={{ ml: 3, fontWeight: 700 }}>
                {group}
              </Typography>
            )
          }
          return (
            <div key={idx}>
              {title}
              <Box sx={{ pl: 6 }}>
                <Typography component="span">&bull; {skill}</Typography>
              </Box>
            </div>
          )
        })}
      </Accordion>
    )
  )
}

export default LbaJobTechniques
