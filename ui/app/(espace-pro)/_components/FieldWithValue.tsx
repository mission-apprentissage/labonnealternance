import { fr } from "@codegouvfr/react-dsfr"
import { Box, Typography } from "@mui/material"
import { InfoTooltip } from "./InfoToolTip"

export const FieldWithValue = ({ title, value, hideIfEmpty = false, tooltip }: { title: string; value: React.ReactNode; tooltip?: React.ReactNode; hideIfEmpty?: boolean }) => {
  const isValueEmpty = value === null || value === undefined
  if (hideIfEmpty && isValueEmpty) {
    return null
  }
  return (
    <Box sx={{ display: "flex", alignItems: "flex-start" }}>
      <Typography
        sx={{
          mr: fr.spacing("2v"),
        }}
      >
        {title}&nbsp;:
      </Typography>
      {!isValueEmpty ? (
        <Typography sx={{ background: "#F9F8F6", px: 1, py: "2px", mr: 1, fontWeight: 700 }}>{value}</Typography>
      ) : (
        <Typography sx={{ textTransform: "uppercase", background: "#FFE9E9", color: "#CE0500", px: 1, py: "2px", fontWeight: 700, mr: 1 }}>Non identifié</Typography>
      )}
      {/* Le nom du déclencheur dépend du champ décrit : « Informations sur SIRET », « Informations sur Enseigne »…
          Quand l'appelant fournit lui-même un <InfoTooltip>, c'est à lui de le nommer. */}
      {tooltip && (typeof tooltip === "string" ? <InfoTooltip label={`Informations sur ${title}`}>{tooltip}</InfoTooltip> : tooltip)}
    </Box>
  )
}
