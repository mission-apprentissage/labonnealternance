import { fr } from "@codegouvfr/react-dsfr"
import { Box, Typography } from "@mui/material"
import type { ReactNode } from "react"

export const DescriptionSection = ({ descriptionParts }: { descriptionParts: Array<ReactNode> }) => (
  <Box gap={fr.spacing("4v")} display="flex" flexDirection="column">
    {descriptionParts.map((part, index) => (
      <Typography key={index} component={"span"} variant="body1" color={fr.colors.decisions.text.default.info.default} lineHeight={fr.spacing("8v")} fontSize={"18px"}>
        {part}
      </Typography>
    ))}
  </Box>
)
