import { List, ListItem, Typography } from "@mui/material"
import type { ReactNode } from "react"

export const ParagraphList = ({ listItems }: { listItems: Array<ReactNode> }) => (
  <List sx={{ listStyleType: "disc", ml: 2, pl: 2, mb: 2 }} disablePadding dense>
    {listItems.map((item, index) => (
      <ListItem key={index} sx={{ display: "list-item" }}>
        <Typography component="span" variant="body1">
          {item}
        </Typography>
      </ListItem>
    ))}
  </List>
)
