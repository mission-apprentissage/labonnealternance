import { fr } from "@codegouvfr/react-dsfr"
import Accordion from "@codegouvfr/react-dsfr/Accordion"
import { Box, Typography } from "@mui/material"
import { Fragment, useMemo } from "react"
import type { ILbaItemPartnerJobJson } from "shared"

const LbaJobTechniques = ({ job }: { job: ILbaItemPartnerJobJson }) => {
  const groupedSkills = useMemo(() => {
    const groups: { group: string; skills: string[] }[] = []
    for (const competence of job.job.offer_to_be_acquired_knowledge ?? []) {
      const [group, skill] = competence.split("\t")
      const last = groups.at(-1)
      if (last?.group === group) last.skills.push(skill)
      else groups.push({ group, skills: [skill] })
    }
    return groups
  }, [job.job.offer_to_be_acquired_knowledge])

  if (!groupedSkills.length) return null

  return (
    <Accordion label="Domaines et techniques de travail">
      {groupedSkills.map(({ group, skills }, groupIdx) => (
        <Fragment key={groupIdx}>
          <Typography sx={{ fontWeight: 700 }}>{group}</Typography>
          <Box component="ul" sx={{ m: 0, pl: fr.spacing("10v") }}>
            {skills.map((skill, idx) => (
              <Typography component="li" key={idx} sx={{ pb: 0 }}>
                {skill}
              </Typography>
            ))}
          </Box>
        </Fragment>
      ))}
    </Accordion>
  )
}

export default LbaJobTechniques
