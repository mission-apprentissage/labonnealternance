import { List, ListItem, Typography } from "@mui/material"
import type { ReactNode } from "react"

export const ParagraphList = ({ listItems, ordered }: { listItems: Array<ReactNode>; ordered?: boolean }) => (
  <List sx={{ listStyleType: "disc", ml: 2, pl: 2, mb: 2 }} disablePadding dense component={ordered ? "ol" : "ul"}>
    {listItems.map((item, index) => (
      <ListItem key={index} sx={{ display: "list-item" }}>
        <Typography component="span" variant="body1">
          {item}
        </Typography>
      </ListItem>
    ))}
  </List>
)
