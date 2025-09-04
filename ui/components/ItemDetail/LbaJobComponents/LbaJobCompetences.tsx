import Accordion from "@codegouvfr/react-dsfr/Accordion"
import { Box, Typography } from "@mui/material"
import { ILbaItemLbaJobJson } from "shared"

const LbaJobCompetences = ({ job }: { job: ILbaItemLbaJobJson }) => {
  let currentSkillGroup = null

  return (
    job?.job?.offer_to_be_acquired_skills?.length && (
      <Accordion label="Compétences qui seront acquises durant l’alternance">
        {job.job.offer_to_be_acquired_skills.map((competence, idx) => {
          const [group, skill] = competence.split("\t")
          let title = <></>

          if (group !== currentSkillGroup) {
            currentSkillGroup = group
            title = (
              <Typography component="span" sx={{ fontWeight: 700 }}>
                {group}
              </Typography>
            )
          }
          return (
            <div key={idx}>
              {title}
              <Box sx={{ pl: 3 }}>
                <Typography component="span">&bull; {skill}</Typography>
              </Box>
            </div>
          )
        })}
      </Accordion>
    )
  )
}

export default LbaJobCompetences
