import { Box, Typography } from "@mui/material"

import InfoTooltip from "./InfoToolTip"

export const FieldWithValue = ({
  title,
  value,
  hideIfEmpty = false,
  tooltip,
}: {
  title: React.ReactNode
  value: React.ReactNode
  tooltip?: React.ReactNode
  hideIfEmpty?: boolean
}) => {
  const isValueEmpty = value === null || value === undefined
  if (hideIfEmpty && isValueEmpty) {
    return null
  }
  return (
    <Box sx={{ display: "flex", alignItems: "center" }}>
      <Typography mr={1} sx={{ minWidth: "fit-content" }}>
        {title} :
      </Typography>
      {!isValueEmpty ? (
        <Typography sx={{ background: "#F9F8F6", px: 1, py: "2px", mr: 1, fontWeight: 700 }}>{value}</Typography>
      ) : (
        <Typography sx={{ textTransform: "uppercase", background: "#FFE9E9", color: "#CE0500", px: 1, py: "2px", fontWeight: 700, mr: 1 }}>Non identifié</Typography>
      )}
      {tooltip && (typeof tooltip === "string" ? <InfoTooltip description={tooltip} /> : tooltip)}
    </Box>
  )
}
