import { fr } from "@codegouvfr/react-dsfr"
import { Typography } from "@mui/material"

export const UpdatedAtSection = ({ date }: { date: string }) => (
  <Typography component="span" variant="subtitle1" color={fr.colors.decisions.text.mention.grey.default} fontStyle={"italic"}>
    Mise à jour le {date}
  </Typography>
)
