import { fr } from "@codegouvfr/react-dsfr"
import { Tooltip, Typography } from "@mui/material"
import React from "react"

const InfoTooltip = ({ description }) => {
  return (
    <Tooltip
      title={
        <Typography sx={{ backgroundColor: "white", color: "#1e1e1e" }} p={1}>
          {description}
        </Typography>
      }
      leaveDelay={200}
      enterDelay={300}
      placement="right"
      slotProps={{
        tooltip: {
          sx: {
            backgroundColor: "white",
            boxShadow: 1,
          },
        },
      }}
    >
      <Typography component="span" sx={{ _hover: { cursor: "pointer" } }}>
        <Typography color={fr.colors.decisions.text.mention.grey.default} className={fr.cx("fr-icon-information-line")} />
      </Typography>
    </Tooltip>
  )
}

export default InfoTooltip
