import { fr } from "@codegouvfr/react-dsfr"
import { Box, Typography } from "@mui/material"

export const DescriptionSection = ({ descriptionParts }: { descriptionParts: Array<string> }) => (
  <Box gap={fr.spacing("4v")} display="flex" flexDirection="column">
    {descriptionParts.map((part, index) => (
      <Typography key={index} component={"span"} variant="body1" color={fr.colors.decisions.text.default.info.default} lineHeight={fr.spacing("6v")}>
        {part}
      </Typography>
    ))}
  </Box>
)
