import Accordion from "@codegouvfr/react-dsfr/Accordion"
import { Box, Typography } from "@mui/material"
import { useMemo } from "react"
import type { ILbaItemPartnerJobJson } from "shared"

const LbaJobTechniques = ({ job }: { job: ILbaItemPartnerJobJson }) => {
  const groupedSkills = useMemo(() => {
    if (!job.job.offer_to_be_acquired_knowledge?.length) return []

    let currentGroup: string | null = null
    return job.job.offer_to_be_acquired_knowledge.map((competence, idx) => {
      const [group, skill] = competence.split("\t")
      const shouldShowTitle = group !== currentGroup
      currentGroup = group
      return { group, skill, shouldShowTitle, idx }
    })
  }, [job.job.offer_to_be_acquired_knowledge])

  if (!groupedSkills.length) return null

  return (
    <Accordion label="Domaines et techniques de travail">
      {groupedSkills.map(({ group, skill, shouldShowTitle, idx }) => (
        <div key={idx}>
          {shouldShowTitle && (
            <Typography component="span" sx={{ fontWeight: 700 }}>
              {group}
            </Typography>
          )}
          <Box sx={{ pl: 3 }}>
            <Typography component="span">&bull; {skill}</Typography>
          </Box>
        </div>
      ))}
    </Accordion>
  )
}

export default LbaJobTechniques
