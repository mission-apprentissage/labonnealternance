import Accordion from "@codegouvfr/react-dsfr/Accordion"
import { Typography } from "@mui/material"
import React from "react"
import { ILbaItemLbaJobJson, ILbaItemPartnerJobJson } from "shared"
import { LBA_ITEM_TYPE } from "shared/constants/lbaitem"

export const BAD_DESCRIPTION_LENGTH = 50
const BULLET = <>&bull;</>

export const JobDescription = ({ job }: { job: ILbaItemPartnerJobJson | ILbaItemLbaJobJson }) => {
  const { description, employeurDescription } = job.job
  const validCustomDescription = description && description.length > BAD_DESCRIPTION_LENGTH ? description : null

  if (validCustomDescription || employeurDescription) {
    return (
      <>
        {validCustomDescription && (
          <JobDescriptionAccordion title={`Description ${job.job.partner_label === LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA ? " du métier" : "de l'offre"}`}>
            {validCustomDescription}
          </JobDescriptionAccordion>
        )}
        {employeurDescription && <JobDescriptionAccordion title="Description de l'employeur">{employeurDescription}</JobDescriptionAccordion>}
      </>
    )
  }

  return null
}

export const JobDescriptionAccordion = ({
  title,
  children,
  items,
  defaultExpanded = true,
}: {
  title: string
  children?: React.ReactNode
  items?: string[]
  defaultExpanded?: boolean
}) => {
  return (
    <Accordion label={title} defaultExpanded={defaultExpanded}>
      {children && <Typography sx={{ whiteSpace: "pre-wrap" }} dangerouslySetInnerHTML={{ __html: children }} />}
      {items?.length > 0 &&
        items.map((item, i) => (
          <div key={`accordion_${title}_${i}`}>
            {items.length > 1 && BULLET}
            <Typography component="span" sx={{ ml: items.length > 1 ? 3 : 0, mt: items.length > 1 ? 2 : 0, whiteSpace: "pre-wrap" }}>
              {item}
            </Typography>
          </div>
        ))}
    </Accordion>
  )
}
