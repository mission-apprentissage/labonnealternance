import { fr } from "@codegouvfr/react-dsfr"
import { List, ListItem, Typography } from "@mui/material"
import type { ReactNode } from "react"

export const ParagraphList = ({ listItems, ordered }: { listItems: Array<ReactNode>; ordered?: boolean }) => (
  <List
    sx={{ listStyleType: ordered ? "decimal" : "disc", ml: fr.spacing("4v"), pl: fr.spacing("4v"), mb: fr.spacing("4v") }}
    disablePadding
    dense
    component={ordered ? "ol" : "ul"}
  >
    {listItems.map((item, index) => (
      <ListItem key={index} sx={{ display: "list-item" }}>
        <Typography component="span" variant="body1">
          {item}
        </Typography>
      </ListItem>
    ))}
  </List>
)
