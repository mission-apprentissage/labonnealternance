import Accordion from "@codegouvfr/react-dsfr/Accordion"
import { Typography } from "@mui/material"

const BULLET = <>&bull;</>
export const JobAccordion = ({ title, children, items, defaultExpanded = true }: { title: string; children?: React.ReactNode; items?: string[]; defaultExpanded?: boolean }) => {
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
