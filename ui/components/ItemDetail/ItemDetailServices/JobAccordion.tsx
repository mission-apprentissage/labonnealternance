import { fr } from "@codegouvfr/react-dsfr"
import Accordion from "@codegouvfr/react-dsfr/Accordion"
import { Box, Typography } from "@mui/material"

export const JobAccordion = ({ title, children, items, defaultExpanded = true }: { title: string; children?: React.ReactNode; items?: string[]; defaultExpanded?: boolean }) => {
  return (
    <Accordion label={title} defaultExpanded={defaultExpanded}>
      {children && <Typography sx={{ whiteSpace: "pre-wrap" }} dangerouslySetInnerHTML={{ __html: children }} />}
      {items?.length > 1 && (
        <Box component="ul" sx={{ m: 0, pl: fr.spacing("8v") }}>
          {items.map((item, i) => (
            <Typography component="li" key={`accordion_${title}_${i}`} sx={{ pb: 0, whiteSpace: "pre-wrap" }}>
              {item}
            </Typography>
          ))}
        </Box>
      )}
      {items?.length === 1 && <Typography sx={{ whiteSpace: "pre-wrap" }}>{items[0]}</Typography>}
    </Accordion>
  )
}
