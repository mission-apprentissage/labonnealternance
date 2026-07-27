import { fr } from "@codegouvfr/react-dsfr"
import { Box, Typography } from "@mui/material"
import type { ReactNode } from "react"

export const DescriptionSection = ({ descriptionParts }: { descriptionParts: Array<ReactNode> }) => (
  <Box gap={fr.spacing("4v")} display="flex" flexDirection="column">
    {descriptionParts.map((part, index) => (
      <Typography key={index} component={"span"} variant="body1" sx={{ lineHeight: "32px", fontSize: "20px", color: "#666" }}>
        {part}
      </Typography>
    ))}
  </Box>
)
